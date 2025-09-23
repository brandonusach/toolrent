import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "http://localhost:8080", // Ajusta según tu servidor Keycloak
    realm: "toolrent-realm",
    clientId: "toolrent-frontend",
});

export default keycloak;