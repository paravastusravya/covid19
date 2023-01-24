const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (error) {
    console.log(`Db Error : ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertStateDbObjToResponseObj = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjToResponseObj = (dbObject) => {
  return {
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// GET state details API 1
app.get("/states/", async (request, response) => {
  const getStates = `
    SELECT * 
    FROM
    state ;
    `;
  const statesArray = await db.all(getStates);
  response.send(
    statesArray.map((eachState) => convertStateDbObjToResponseObj(eachState))
  );
});

//API 2 get state by state_id
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `
    select *
    FROM
    state
    WHERE state_id = ${stateId};
    `;
  const state = await db.get(getState);
  response.send(convertStateDbObjToResponseObj(state));
});

//API 3 create new district (POST)
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
  const updateDistrict = `
    INSERT INTO 
    district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');
    `;
  await db.run(updateDistrict);
  response.send("District Successfully Added");
});

//API 4 get district by district_id (GET)
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`;
  const district = await db.get(getDistrictsQuery);
  response.send(convertDistrictDbObjToResponseObj(district));
});

//API 5 delete district (DELETE)
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

//API 6 update district (PUT)
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = `
  UPDATE district
  SET 
  district_name = '${districtName}',
  state_id = '${stateId}',
  cases = '${cases}',
  cured = '${cured}',
  active = '${active}',
  deaths = '${deaths}'
  WHERE district_id = ${districtId};  
  `;
  const updatedDistrict = await db.run(updateDistrict);
  response.send("District Details Updated");
});

//API 7 get total number of cases, cured, active, deaths

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `
    SELECT state_name FROM
    state NATURAL JOIN district
    WHERE district_id = ${districtId};
    `;
  const stateNames = await db.get(getStateName);
  response.send({ stateName: stateNames.state_name });
});
module.exports = app;
