const HTTP_CODE_UNAUTHORIZED = 401;
const UNAUTHORIZED_ERROR_MESSAGE = "Please ensure the Service Account Token is vaulted in the correct format and that your service account has sufficient privileges to perform this operation. Consult the plugin documentation for more details.";

function validateNamespace(namespace, deleteFunction, objectType) {
  const namespaced = deleteFunction.name.includes("Namespaced");
  if (namespaced && !namespace) {
    throw new Error(`Must specify namespace to delete object of type '${objectType}`);
  }
}

async function applySpec(client, spec) {
  try {
    await client.read(spec);
  } catch (error) {
    return client.create(spec);
  }
  return client.patch(spec);
}

function extractResponseData(response) {
  const data = response?.body?.items;

  if (!data) {
    throw new Error("Response is missing data.");
  }

  return data;
}

function parseError(err) {
  if (err?.body?.code === HTTP_CODE_UNAUTHORIZED) {
    return `${UNAUTHORIZED_ERROR_MESSAGE} ${err.body}`;
  }

  return err.body ? err.body : err;
}

function decodeBase64(content) {
  return Buffer.from(content, "base64").toString("utf-8");
}

module.exports = {
  validateNamespace,
  applySpec,
  extractResponseData,
  parseError,
  decodeBase64,
};
