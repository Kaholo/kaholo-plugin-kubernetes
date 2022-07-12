const { parseErr } = require("./helpers");

async function getService(client, { name, namespace }) {
  try {
    const res = await client.readNamespacedService(name, namespace);

    return res.body;
  } catch (err) {
    throw parseErr(err);
  }
}

module.exports = {
  getService,
};
