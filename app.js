const express = require("express");
const app = express();
app.use(express.json());
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
    process.exit(1);
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

//Add districts Table API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addQueryUpdate = `
    INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const r = await db.run(addQueryUpdate);
  const d = r.lastID;

  response.send("District Successfully Added");
});

//Get districtId API
const convertCase2 = (each) => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getQueryResult = `
    SELECT * FROM district WHERE district_id = ${districtId};`;
  const getDistrictId = await db.get(getQueryResult);
  response.send(convertCase2(getDistrictId));
});
//Delete District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const DeleteQuery = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  const districtArray = await db.get(DeleteQuery);
  response.send("District Removed");
});

//Update districts API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = updateDetails;
  const updateQuery = `
    UPDATE district
    SET district_name = '${districtName}',
        state_id = '${stateId}',
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
        WHERE district_id = ${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//Get statesId API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths) FROM district
    WHERE state_id = ${stateId};`;
  const getState = await db.get(getStateIdQuery);
  response.send({
    totalCases: getState["SUM(cases)"],
    totalCured: getState["SUM(cured)"],
    totalActive: getState["SUM(active)"],
    totalDeaths: getState["SUM(deaths)"],
  });
});

//ADD districtId API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getQueryDistrictId = `
    SELECT state_id FROM district WHERE district_id = ${districtId}`;
  const getQuery = await db.get(getQueryDistrictId);
  const getQueryDetails = `
  SELECT state_name as stateName FROM state
  WHERE state_id = ${getQuery.state_id};`;
  const getQueryResult = await db.get(getQueryDetails);
  response.send(getQueryResult);
});

module.exports = app;
