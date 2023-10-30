import React from "react";
import "./header.scss";

function StaticHeader({ theme }) {
  return (
    <>
      <div>
        <h1 className={`h1text ${theme === "light" ? "light" : "dark"}`}>
          OSCE-GPT
        </h1>
        <p className={`tagline ${theme === "light" ? "light" : "dark"}`}>
          Powered by Whisper, GPT-4, and Google text-to-speech.{" "}
        </p>
        <p className={`tagline ${theme === "light" ? "light" : "dark"}`}>
          By <a href="https://tig3r66.github.io/" target="_blank" rel="noreferrer">Eddie Guo</a>
        </p>
      </div>
    </>
  );
}

export default StaticHeader;
