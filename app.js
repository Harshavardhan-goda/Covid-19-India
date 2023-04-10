const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
  }
};
initializeDbAndServer();

const convertCase1 = (each) => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  };
};
//Get states API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;`;
  const stateArray = await db.all(getStatesQuery);
  response.send(stateArray.map((each) => convertCase1(each)));
});

//Get specific stateId API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT * FROM state WHERE state_id = ${stateId};`;
  const getStateId = await db.get(getStateIdQuery);
  response.send(convertCase1(getStateId));
});
module.exports = app;
