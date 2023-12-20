const fs = require("fs").promises;
const fetch = require("node-fetch");
const mapLimit = require("async/mapLimit");

const resources = ["Condition", "Device", "DeviceUseStatement"];
//ConceptMap, DocumentReference, MedicationRequest, OperationDefinition, Practitioner
//const resources = ["AllergyIntolerance", "Condition", "Device", "DeviceUseStatement", "Encounter", "Immunization", "Medication", "MedicationStatement", "Observation", "Organization", "Patient", "Procedure"];
const dataDir = "bundles/submit";

const fhirBaseUrl = "http://***.***.***.***:****/fhir";
const batchSize = 10;

const submitBundle = (bundle, filename) => {
  console.log(`Submitting ${filename}`);

  return fetch(fhirBaseUrl, {
    method: "post",
    body: bundle,
    headers: { "Content-Type": "application/fhir+json" }
  }).then(res => {
    console.log(
      `Submitting ${filename} completed with response code ${res.status}`
    );

    return res.status;
  });
};

const submitBatches = (submitDir, bundleFilenames) => {
  mapLimit(
    bundleFilenames,
    batchSize,
    async function(bundleFilename) {
      console.log(`Reading ${submitDir}/${bundleFilename}`);

      return fs
        .readFile(`${submitDir}/${bundleFilename}`)
        .then(bundle => submitBundle(bundle, bundleFilename));
    },
    (err, results) => {
      if (err) throw err;
      // results is now an array of the response bodies
      console.log(results);
    }
  );
};

const submit = () => {
  resources.forEach(resource => {
    const submitDir = `${dataDir}/${resource}`;
    const bundleFilenames = [];

    fs.readdir(submitDir)
      .then(items => {
        items.forEach(item => {
          bundleFilenames.push(item);
        });

        submitBatches(submitDir, bundleFilenames);
      })
      .catch(e => {
        console.log(`Error submitting: ${e}`);
      });
  });
};

submit();