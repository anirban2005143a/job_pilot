import { JobSource1 } from "./sources/job_source_1.js";

const sourceImplementations = {
  JobSource1: JobSource1,
  // JobSource2: JobSource1,
  // JobSource3: JobSource1,
  // JobSource4: JobSource1,
  // JobSource5: JobSource1,
};

export const hasSourceImplementation = (implementation) => {
  return Object.hasOwn(sourceImplementations, implementation);
};

export const getSourceImplementation = (implementation) => {
  const SourceClass = sourceImplementations[implementation];

  if (!SourceClass) {
    throw new Error(
      `Source implementation "${implementation}" is not registered`,
    );
  }

  return SourceClass;
};


//source - a mongodb object
export const createJobSourceObject = (source) => {
  const SourceClass = sourceImplementations[source.implementation];

  if (!SourceClass) {
    throw new Error(
      `No implementation found for source: ${source.name} (${source.implementation})`,
    );
  }

  return new SourceClass({
    sourceId : source._id,
    source_name: source.name,
    base_url: source.base_url,
    active: source.active,
    max_application_per_hour: source.max_applications_per_hour,
    pollingInterval: source.polling_interval,
  });
};
