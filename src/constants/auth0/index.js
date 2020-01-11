import { ManagementClient, AuthenticationClient } from "auth0";
import dotenv from "dotenv";
dotenv.config();

const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = process.env;

export const Management = new ManagementClient({
  domain: `${AUTH0_DOMAIN}`,
  clientId: `${AUTH0_CLIENT_ID}`,
  clientSecret: `${AUTH0_CLIENT_SECRET}`,
  scope: "read:users update:users"
});

export const Authentication = new AuthenticationClient({
  domain: `${AUTH0_DOMAIN}`,
  clientId: `${AUTH0_CLIENT_ID}`,
  clientSecret: `${AUTH0_CLIENT_SECRET}`
});
