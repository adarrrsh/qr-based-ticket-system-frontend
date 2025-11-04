import { useState } from "react";
import QRTicketSystem from "./components/Scanner";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <QRTicketSystem />
    </>
  );
}

export default App;
