import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div>
      <h1>My Portfolio</h1>
      <p>Hello GitHub Pages</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
