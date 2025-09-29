const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Make sure admin is initialized properly
admin.initializeApp();

// Helper function to fetch paginated fuel data and store it in Firestore
const fetchFuelDataLogic = async () => {
  const baseUrl = "https://goriva.si/api/v1/search/?format=json";
  let page = 1;
  let nextPageUrl = `${baseUrl}&page=${page}`;
  let allResults = [];

  try {
    // Fetch first page to get the structure
    console.log(`Fetching initial page: ${nextPageUrl}`);
    let response = await fetch(nextPageUrl);

    if (!response.ok) {
      throw new Error(`API response not OK: ${response.statusText}`);
    }

    // Get the first page data
    let data = await response.json();
    console.log(
      `First page has ${data.results.length} results. Total count: ${data.count}`
    );

    // Add first page results to our collection
    allResults = [...data.results];

    // Continue fetching while there's a next page
    while (data.next) {
      console.log(`Fetching next page: ${data.next}`);
      response = await fetch(data.next);

      if (!response.ok) {
        throw new Error(`API response not OK: ${response.statusText}`);
      }

      data = await response.json();
      console.log(
        `Got ${data.results.length} more results. Total so far: ${
          allResults.length + data.results.length
        }`
      );

      // Add this page's results to our collection
      allResults = [...allResults, ...data.results];
    }

    // Create the final data structure
    const finalData = {
      count: allResults.length,
      next: null,
      previous: null,
      results: allResults,
      position: null,
    };

    // Store the combined data in Firestore
    await admin.firestore().collection("data").doc("petrolStations").set({
      data: finalData,
      updatedAt: new Date().toISOString(),
    });

    console.log(
      `Fuel station data updated successfully with ${allResults.length} total records.`
    );
    return finalData;
  } catch (error) {
    console.error("Error in fetchFuelDataLogic:", error);
    throw error;
  }
};

// Scheduled Cloud Function: runs every day at midnight in UTC + 1 time
exports.fetchFuelData = onSchedule(
  {
    schedule: "0 4 * * 2",
    timeZone: "Europe/Ljubljana",
  },
  async (event) => {
    try {
      await fetchFuelDataLogic();
      return null;
    } catch (error) {
      console.error("Error in scheduled function:", error);
      return null;
    }
  }
);

// HTTP Test Function: trigger this URL to run the fetch logic immediately
exports.testFetchFuelData = onRequest(async (req, res) => {
  try {
    const data = await fetchFuelDataLogic();
    res.status(200).send({
      message: "Fuel data fetched successfully.",
      dataStructure: Object.keys(data),
      resultCount: data.results ? data.results.length : 0,
    });
  } catch (error) {
    console.error("Error in testFetchFuelData:", error);
    res.status(500).send("Error: " + error.message);
  }
});
