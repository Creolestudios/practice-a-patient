import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Select } from 'antd';
import './dropdown.scss';
import MicRecorder from 'mic-recorder-to-mp3';
import { server_url } from '../../Config';
import { cases } from './cases.js';
import { CaretDownOutlined } from '@ant-design/icons';
import { useSpeechSynthesis } from 'react-speech-kit';
import { enableAutoTTS } from 'enable-auto-tts';
enableAutoTTS();

function Selector({ theme }) {
  const [isRecording, setIsRecording] = useState(false);
  const { speak } = useSpeechSynthesis();
  const [Mp3Recorder, setMp3Recorder] = useState(
    new MicRecorder({ bitRate: 128 })
  );
  const [options, setOptions] = useState([]);
  const [selectedOptionValue, setSelectedOptionValue] = useState();
  const [selectedResValue, setSelectedResValue] = useState();
  const [diseaseImages, setDiseaseImages] = useState([]);
  const [resData, setResData] = useState([]);
  const [feedback, setFeedback] = useState();
  const [error, setError] = useState();
  const [resError, setResError] = useState();
  const [isConversationEnded, setConversationEnded] = useState(false);
  const [isFeedbackEnabled, setFeedbackEnabled] = useState(false);
  const [feedbackError, setFeedbackError] = useState();
  const [loader, setLoader] = useState(false);
  // const voices = [0, 2, 12, 15];
  // const randomIndex = Math.floor(Math.random() * voices.length);
  // const randomVoiceValue = voices[randomIndex];
  var randomVoiceValue = 0;

  const [isLoading, setIsLoading] = useState(false);

  const noRender = useRef(false);

  const handleChange = (value) => {
    setConversationEnded(false);
    setFeedbackEnabled(false);
    setFeedback('');
    setFeedbackError('');
    setResData([]);

    let memory = [{ role: 'system', content: '' }];
    let tokens = 0;
    let maxTokens = 4000;
    let history = [];

    let historyString = JSON.stringify(history);
    let memoryString = JSON.stringify(memory);

    sessionStorage.setItem('history', historyString);
    sessionStorage.setItem('memory', memoryString);
    sessionStorage.setItem('tokens', tokens.toString());
    sessionStorage.setItem('maxTokens', maxTokens.toString());

    setResData([]);
    setSelectedOptionValue(value);
    const selectedValue = value;

    const body = {
      option: selectedValue,
      // history: JSON.parse(sessionStorage.getItem("history")),
      memory: JSON.parse(sessionStorage.getItem('memory')),
      // maxTokens: parseInt(sessionStorage.getItem("maxTokens")),
      tokens: parseInt(sessionStorage.getItem('tokens')),
    };

    setDiseaseImages([]);
    setLoader(true);

    axios
      .post(server_url + 'createprompt', body)
      .then(async (res) => {
        setSelectedResValue(res?.data?.text);
        setDiseaseImages(res?.data?.diseaseImage);

        const updatedUrls = res?.data?.diseaseImage.map((url) => {
          const id = url.match(/\/d\/(.+?)\//)[1];
          return `https://drive.google.com/uc?export=view&id=${id}`;
        });

        setDiseaseImages(updatedUrls);
        setLoader(false);

        await sessionStorage.setItem('memory', JSON.stringify(res.data.memory));
        await sessionStorage.setItem('tokens', res.data.tokens.toString());
      })
      .catch((e) => {
        setLoader(false);
      });
  };

  const handleTextToSpeech = async (text) => {
    const maxChunkLength = 200; // Maximum length of each chunk
    const chunks = [];
    let currentChunk = '';
    // Split the text into smaller chunks
    const words = text.split(' ');
    for (const word of words) {
      if ((currentChunk + ' ' + word).length <= maxChunkLength) {
        currentChunk += ' ' + word;
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      }
    }
    chunks.push(currentChunk.trim());

    const voices = window.speechSynthesis.getVoices();
    // Speak each chunk sequentially
    for (const chunk of chunks) {
      const utterance = new SpeechSynthesisUtterance(chunk);

      // const voiceNo = sessionStorage.getItem("voice");

      // utterance.voice = voices[parseInt(voiceNo)];
      if (cases[selectedOptionValue][0].voice === 'male') {
        randomVoiceValue = 15;
      } else {
        randomVoiceValue = 0;
      }
      utterance.voice = voices[randomVoiceValue];
      utterance.rate = 0.9;

      speechSynthesis.speak(utterance);
    }

    // speak({ text: text });
  };

  // Start recording voice via microphone
  const startRecording = async () => {
    setResError('');
    setFeedback('');

    Mp3Recorder.start()
      .then(() => {
        setIsRecording(true);
      })
      .catch((e) =>
        setError(
          'Error accessing microphone. Please, give permission to access microphone.'
        )
      );
  };

  // stop recording and send it to backend
  const stopRecording = async () => {
    setResError('');
    setFeedback('');

    Mp3Recorder.stop()
      .getMp3()
      .then(async ([buffer, blob]) => {
        setIsRecording(false);

        // do what ever you want with buffer and blob
        const formData = new FormData();
        formData.append('file', blob);

        await axios
          .post(server_url + 'audio', formData)
          .then(async (res) => {
            setResData((resData) => [...resData, 'Me: ' + res.data.text]);

            await axios
              .post(server_url + 'audiotext', {
                text: res.data.text,
                history: JSON.parse(sessionStorage.getItem('history')),
                memory: JSON.parse(sessionStorage.getItem('memory')),
                maxTokens: parseInt(sessionStorage.getItem('maxTokens')),
                tokens: parseInt(sessionStorage.getItem('tokens')),
              })
              .then((res) => {
                if (res.data?.error === undefined) {
                  setResData((resData) => [
                    ...resData,
                    'Patient: ' + res.data.text,
                  ]);
                  handleTextToSpeech(res.data.text);

                  sessionStorage.setItem(
                    'memory',
                    JSON.stringify(res.data.memory)
                  );
                  sessionStorage.setItem('tokens', res.data.tokens.toString());
                  sessionStorage.setItem(
                    'history',
                    JSON.stringify(res.data.history)
                  );
                  sessionStorage.setItem(
                    'maxTokens',
                    res.data.maxTokens.toString()
                  );
                } else {
                  setResData((resData) => [
                    ...resData,
                    'Patient: ' + res.data.error,
                  ]);
                  handleTextToSpeech(res.data.error);
                }
              })
              .catch((error) => {
                setResError('Error retrieving message. Try again later.');
              });
          })
          .catch((e) => {
            setResError('Error retrieving message. Try again later.');
          });
      });
  };

  // End conversation and get feedback
  const endConversation = () => {
    setConversationEnded(true);
    setFeedbackEnabled(true);
    setFeedback('');
  };

  const getFeedback = async () => {
    setFeedback('');
    setFeedbackError('');
    setIsLoading(true);

    try {
      let instructions =
        "Instructions: Based on the chat dialogue between me and the patient, please provide constructive feedback and criticism for me, NOT the patient. If relevant, provide the diagnosis and potential differential diagnoses to the case. Comment on things that were done well, areas for improvement, and other remarks as necessary. For example, patient rapport, conversation organization, exploration of a patient's problem, involvement of the patient in care, explanation of reasoning, appropriate clinical reasoning, and other aspects of the interaction relevant to a patient interview. If relevant, suggest additional questions that I could have asked. Do not make anything up.";
      const conversation = JSON.parse(sessionStorage.getItem('history')).join(
        '\n'
      );

      let innerText = '';

      if (conversation.length > 0) {
        // Fetch the response from the OpenAI API with the signal from AbortController
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.REACT_APP_OPENAI_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4',
              temperature: 0.5,
              top_p: 1,
              messages: [
                {
                  role: 'user',
                  content: conversation + instructions,
                },
              ],
              stream: true,
            }),
          }
        );
        // Read the response as a stream of data
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            break;
          }
          // Massage and parse the chunk of data
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          const parsedLines = lines
            .map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
            .filter((line) => line !== '' && line !== '[DONE]') // Remove empty lines and "[DONE]"
            .map((line) => JSON.parse(line)); // Parse the JSON string

          for (const parsedLine of parsedLines) {
            const { choices } = parsedLine;
            const { delta } = choices[0];
            const { content } = delta;
            // Update the UI with the new content
            if (content) {
              innerText += content;
              setFeedback(innerText);
            }
          }
        }
      } else {
        setFeedback('No conversation to provide feedback on.');
        setIsLoading(false);
      }
    } catch (error) {
      setFeedbackError('Error occurred while generating. Please, try again.');
      setIsLoading(false);
    }
  };

  const getSoap = async () => {
    setFeedback('');
    setFeedbackError('');
    setIsLoading(true);

    try {
      let instructions =
        'Based on the chat dialogue between me and the patient, please write a SOAP note. Use bullet points for each item. Use medical abbreviations and jargon as appropriate (e.g., PO, BID, NPO). Do not make anything up.';
      const conversation = JSON.parse(sessionStorage.getItem('history')).join(
        '\n'
      );

      let innerText = '';

      if (conversation.length > 0) {
        // Fetch the response from the OpenAI API with the signal from AbortController
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.REACT_APP_OPENAI_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4',
              temperature: 0.5,
              top_p: 1,
              messages: [
                {
                  role: 'user',
                  content: conversation + instructions,
                },
              ],
              stream: true,
            }),
          }
        );
        // Read the response as a stream of data
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            break;
          }
          // Massage and parse the chunk of data
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          const parsedLines = lines
            .map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
            .filter((line) => line !== '' && line !== '[DONE]') // Remove empty lines and "[DONE]"
            .map((line) => JSON.parse(line)); // Parse the JSON string

          for (const parsedLine of parsedLines) {
            const { choices } = parsedLine;
            const { delta } = choices[0];
            const { content } = delta;
            // Update the UI with the new content
            if (content) {
              innerText += content;
              setFeedback(innerText);
            }
            //   } else {
            //     innerText += "";
            //     setFeedback(innerText);
            //   }
          }
        }
      } else {
        setFeedback('No conversation to provide SOAP note on.');
        setIsLoading(false);
      }
      // const data = await response.json();
      // resultText.innerText = data.choices[0].message.content;
    } catch (error) {
      // console.log(error)
      setFeedbackError('Error occurred while generating. Please, try again.');
      setIsLoading(false);
    }
  };

  const getPresentation = async () => {
    setFeedback('');
    setFeedbackError('');
    setIsLoading(true);

    try {
      let instructions =
        'Based on the chat dialogue between me and the patient, please present the patient to an attending physician. Use the F-SOAP model. F = frame: ID, relevant past medical history, chief complaint. S = Story: HPI, pertinent positives and negatives. O = objective data: vitals, physical exam, investigations. A = assessment: ddx (working dx, dangerous ddx, common ddx). P = Plan: symptomatic treatment, interventions/investigations, disposition, education. Use medical abbreviations and jargon as appropriate (e.g., PO, BID, NPO). Do not make anything up. If data is not available, e.g., vitals, investigations, do not make it up.';
      const conversation = JSON.parse(sessionStorage.getItem('history')).join(
        '\n'
      );

      let innerText = '';

      if (conversation.length > 0) {
        // Fetch the response from the OpenAI API with the signal from AbortController
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.REACT_APP_OPENAI_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4',
              temperature: 0.5,
              top_p: 1,
              messages: [
                {
                  role: 'user',
                  content: conversation + instructions,
                },
              ],
              stream: true,
            }),
          }
        );
        // Read the response as a stream of data
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            break;
          }
          // Massage and parse the chunk of data
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          const parsedLines = lines
            .map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
            .filter((line) => line !== '' && line !== '[DONE]') // Remove empty lines and "[DONE]"
            .map((line) => JSON.parse(line)); // Parse the JSON string

          for (const parsedLine of parsedLines) {
            const { choices } = parsedLine;
            const { delta } = choices[0];
            const { content } = delta;
            // Update the UI with the new content
            if (content) {
              innerText += content;
              setFeedback(innerText);
            }
            //   } else {
            //     innerText += "";
            //     setFeedback(innerText);
            //   }
          }
        }
      } else {
        setFeedback('No conversation to provide SOAP note on.');
        setIsLoading(false);
      }
      // const data = await response.json();
      // resultText.innerText = data.choices[0].message.content;
    } catch (error) {
      // console.log(error)
      setFeedbackError('Error occurred while generating. Please, try again.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!noRender.current) {
      setError('');

      // first time set options

      axios
        .get(server_url + 'getcases', {
          headers: {
            'ngrok-skip-browser-warning': '1231',
          },
        })
        .then((res) => {
          setOptions(res.data.cases);
          sessionStorage.setItem('voice', randomVoiceValue.toString());
        })
        .catch((e) => {
          setError('Error fetching options. Please, try again later.');
        });

      noRender.current = true;
    }
  }, []);

  return (
    <div>
      <p className='commonPara'>
        Which clinical scenario would you like to practice with?
      </p>

      <Select
        defaultValue='Select One'
        onChange={handleChange}
        suffixIcon={<CaretDownOutlined />}
        options={options.map((option) => ({ value: option }))}
        disabled={isLoading}
      />

      {selectedOptionValue && (
        <div>
          <p className='commonPara'>You selected: {selectedOptionValue}</p>
          {!loader ? (
            <>
              {/* <p className='commonPara'>
                <b>{selectedResValue}</b>
              </p> */}

              <div className='image-holder'>
                {diseaseImages.map((imgUrl) => (
                  <div className='img' key={imgUrl}>
                    <img src={imgUrl} alt='images-diseases' />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className='flexbox'>
              <div>
                <div className='text'>Please wait</div>
                <div class='dot-loader'></div>
                <div class='dot-loader dot-loader--2'></div>
                <div class='dot-loader dot-loader--3'></div>
              </div>
            </div>
          )}
          <p className='commonPara'>
            <b>
              {selectedResValue &&
                selectedResValue.split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                ))}
            </b>
          </p>

          <hr
            className={`commonPara hrline ${
              theme === 'light' ? 'btnlight' : 'btndark'
            }`}
          />
        </div>
      )}

      {resData.map((resData) => (
        <div className='response'>
          <p className='commonPara'>{resData}</p>
        </div>
      ))}

      {resError && (
        <div
          className='commonPara'
          style={{ fontWeight: 'bold', color: 'red', fontSize: 18 }}
        >
          {resError}
        </div>
      )}

      <div>
        {selectedOptionValue && !isRecording && (
          <button
            className={`btn ${theme === 'light' ? 'btnlight' : 'btndark'} ${
              isConversationEnded ? 'btndisabled' : ''
            }`}
            onClick={startRecording}
            disabled={isRecording || isLoading}
          >
            Start
          </button>
        )}

        {isRecording && (
          <button
            className={`btn ${theme === 'light' ? 'btnlight' : 'btndark'} ${
              isConversationEnded ? 'btndisabled' : ''
            }`}
            onClick={stopRecording}
            disabled={!isRecording || isLoading}
          >
            Stop
          </button>
        )}

        {error && (
          <div
            className='commonPara'
            style={{ fontWeight: 'bold', color: 'red', fontSize: 18 }}
          >
            {error}
          </div>
        )}

        {resData.length > 0 && (
          <>
            <button
              className={`endbtn ${theme === 'light' ? 'btnlight' : 'btndark'}
              ${isConversationEnded ? 'btndisabled' : ''}`}
              onClick={endConversation}
              disabled={isConversationEnded}
            >
              End conversation
            </button>

            {isConversationEnded && (
              <hr
                className={`commonPara hrline ${
                  theme === 'light' ? 'btnlight' : 'btndark'
                }`}
                style={{ marginBottom: 10 }}
              />
            )}

            <button
              className={`endbtn ${
                theme === 'light' ? 'btnlight' : 'btndark'
              } ${!isFeedbackEnabled ? 'btndisabled' : ''}`}
              onClick={getFeedback}
              disabled={isLoading}
              // disabled={true}
            >
              Get Feedback
            </button>

            <button
              className={`endbtn ${
                theme === 'light' ? 'btnlight' : 'btndark'
              } ${!isFeedbackEnabled ? 'btndisabled' : ''}`}
              onClick={getSoap}
              disabled={isLoading}
            >
              SOAP Note
            </button>

            <button
              className={`endbtn ${
                theme === 'light' ? 'btnlight' : 'btndark'
              } ${!isFeedbackEnabled ? 'btndisabled' : ''}`}
              onClick={getPresentation}
              disabled={isLoading}
            >
              Present Patient
            </button>

            <div className='commonPara feedbackpara'>
              {feedback && (
                <>
                  <div className='feedbackformat'>{feedback}</div>
                </>
              )}
            </div>

            {feedbackError && (
              <div style={{ fontWeight: 'bold', color: 'red', fontSize: 18 }}>
                {feedbackError}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Selector;
