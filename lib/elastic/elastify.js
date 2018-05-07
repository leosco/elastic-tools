export default function (data, {
  index,
  type,
  // function to generate an id, if necessary
  idGenerator,
  // transforms to apply to data (you should at least remove the _id)
  transform,
}) {
  const output = [];

  data.forEach((obj) => {
    // first push the action descriptor
    output.push({
      index: {
        _index: index,
        _type: type,
        // assign the _id or build it if it doesn't exist
        // eslint-disable-next-line no-underscore-dangle
        _id: obj._id || idGenerator(),
      },
    });

    // push the transformed obj, if applicable
    output.push(transform ? transform(obj) : obj);
  });

  return output;
}
