const fetch = require("node-fetch");
const { mkdirp } = require("mkdirp");
const fs = require("fs");

const resources = ["Immunization", "Medication", "MedicationStatement"];
//ConceptMap, DocumentReference, MedicationRequest, OperationDefinition, Practitioner
//const resources = ["AllergyIntolerance", "Condition", "Device", "DeviceUseStatement", "Encounter", "Immunization", "Medication", "MedicationStatement", "Observation", "Organization", "Patient", "Procedure"];
const count = 100000;

const fhirBaseUrl = "http://***.***.***.***:****/omoponfhir4/fhir";
const headers = new Headers();
const base64 = require('base-64');
headers.set('Authorization', 'Basic ' + base64.encode("username:password"));

const dataDir = "bundles";

const findNext = links => {
  const next = links.find(link => link.relation === "next");

  return !next ? next : next.url;
};

const saveResource = (bundle, resource) => {
  const dirName = `${dataDir}/${resource}`;

  mkdirp(dirName).then( err => {
    const filename = `${resource}.${bundle.id}.json`;

    fs.writeFile(
      `${dirName}/${filename}`,
      JSON.stringify(bundle, null, 2),
      err => {
        if (err) throw err;
        console.log(`Wrote: ${dirName}/${filename}`);
      }
    );
  });
};

const extractBundle = (bundle, resource) => {
  saveResource(bundle, resource);

  return findNext(bundle.link);
};

const extractResource = async resource => {
  let next = `${fhirBaseUrl}/${resource}?_count=${count}`;

  do {
    console.log(`Fetching ${next}`);

    next = await fetch(next, {headers: headers})
      .then(res => res.json())
      .then(bundle => extractBundle(bundle, resource));
  } while (next != null);
};

const extract = async () => {
// OMOPonFHIR 가 병렬 수행이 안되는 것 같음.
//  resources.forEach(resource => {
//    extractResource(resource);
//  });
  for(let resource of resources) {
    await extractResource(resource);
  }
};

extract();
