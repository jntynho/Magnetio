async function fetchThePornDB() {
  const q = encodeURIComponent("Nia Bleu My Pervy Family");
  try {
    const res = await fetch(`https://api.tpdb.to/scenes?q=${q}`);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data).substring(0, 1000));
  } catch (e) {
    console.error(e);
  }
}
fetchThePornDB();

