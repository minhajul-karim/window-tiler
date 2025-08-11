function App() {
  return (
    <div className="w-screen h-screen relative">
      <div
        className="absolute"
        style={{
          left: 100,
          top: 100,
          width: 300,
          height: 200,
          backgroundColor: "green",
        }}
      >
        Node 1
      </div>
      <button className="fixed bottom-10 right-10 w-15 h-15 rounded-full bg-black text-white text-2xl cursor-pointer">
        +
      </button>
    </div>
  );
}

export default App;
