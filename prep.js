const fs = require("fs");
//const { mkdirp } = require("mkdirp");

function mkdir( dirPath ) {
  const isExists = fs.existsSync( dirPath );
  if( !isExists ) {
      fs.mkdirSync( dirPath, { recursive: true } );
  }
}

const resources = ["Condition", "Device", "DeviceUseStatement"];
//ConceptMap, DocumentReference, MedicationRequest, OperationDefinition, Practitioner
//const resources = ["AllergyIntolerance", "Condition", "Device", "DeviceUseStatement", "Encounter", "Immunization", "Medication", "MedicationStatement", "Observation", "Organization", "Patient", "Procedure"];
const dataDir = "bundles";


const saveBundle = (bundle, id, resource) => {
  const saveDir = `bundles/submit/${resource}`;
  mkdir(saveDir)
  const filename = `${resource}.${id}.submit.json`;

  fs.writeFileSync(
    `${saveDir}/${filename}`,
    JSON.stringify(bundle, null, 2)
  );
  console.log(`Wrote: ${saveDir}/${filename}`);
};

const prepBundle = (bundle, resource) => {
  const submitBundle = {
    resourceType: "Bundle",
    type: "batch"
  };

  submitBundle.entry = bundle.entry.map(entry => {
    entry.resource.id = `A${entry.resource.id}`;
    return {
      request: {
        method: "PUT",
        url: `${entry.resource.resourceType}/${entry.resource.id}`
      },
      resource: entry.resource
    };
  });

  saveBundle(submitBundle, bundle.id, resource);
};

const prep = () => {
  for(let resource of resources) {
    console.log(resource);
    const bundleDir = `${dataDir}/${resource}`;
    const filelist = fs.readdirSync(bundleDir);

    for(item of filelist){
      const data = fs.readFileSync(`${bundleDir}/${item}`);

      const bundle = JSON.parse(data, (key, value) => {
        if (key === 'reference') return value.replace('/','/A');
        return value;
      });

      prepBundle(bundle, resource);
    }
  }
};

prep();