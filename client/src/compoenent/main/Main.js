import React, { useEffect, useState } from "react";
import StaticHeader from "../staticHeader/StaticHeader";
import "./main.scss";
import Selector from "../dropdown/Selector";
import { Switch } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

function Main() {
  const [theme, setTheme] = useState("dark");
  const toggleTheme = (checked) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
  };

  useEffect(() => {
    const body = document.getElementsByTagName("body");
    if (theme === "light") {
      body[0].style.backgroundColor = "#fff";
      body[0].classList.add("light");
      body[0].classList.remove("dark");
    } else {
      body[0].style.backgroundColor = "#0e1117";
      body[0].classList.add("dark");
      body[0].classList.remove("light");
    }
  }, [theme]);

  return (
    <>
      <div className="container">
        <div className="toggleSwitch">
          <Switch
            checkedChildren={
              <FontAwesomeIcon icon={faMoon} className="switch-icon" />
            }
            unCheckedChildren={
              <FontAwesomeIcon icon={faSun} className="switch-icon" />
            }
            defaultChecked
            onChange={toggleTheme}
          />

          <a
            href="https://forms.gle/NRUu8ixYXJGbomd99"
            target="_blank"
            rel="noreferrer"
          >
            <button
              className={`feedbackbtn ${
                theme === "light" ? "btnlight" : "btndark"
              }`}
            >
              Give Feedback
            </button>
          </a>
        </div>
        <div className="staticheader">
          <StaticHeader theme={theme} />
        </div>

        <div className={`selector ${theme === "light" ? "light" : "dark"}`}>
          <Selector theme={theme} />
        </div>
      </div>
    </>
  );
}

export default Main;
