// From https://community.n8n.io/t/self-hosted-user-management/30520
const { dirname, resolve } = require("path");
const Layer = require("express/lib/router/layer");
const { Container } = require("typedi");
const { randomString } = require("n8n-workflow");

const { AuthService } = require(
  resolve(dirname(require.resolve("n8n")), "auth/auth.service"),
);

const { PasswordUtility } = require(
  resolve(dirname(require.resolve("n8n")), "services/password.utility"),
);

//  Thanks https://kb.jarylchng.com/i/n8n-and-authelia-bypass-n8n-native-login-page-usin-sNRmS-7j5u1/

const ignoreAuthRegexp = /^\/(assets|healthz|webhook|rest\/oauth2-credential)/;

module.exports = {
  n8n: {
    ready: [
      async function ({ app }, config) {
        await this.dbCollections.Settings.update(
          { key: "userManagement.isInstanceOwnerSetUp" },
          { value: JSON.stringify(true) },
        );

        config.set("userManagement.isInstanceOwnerSetUp", true);

        const authService = Container.get(AuthService);
        const passwordUtility = Container.get(PasswordUtility);

        const { stack } = app._router;

        const index = stack.findIndex((l) => l.name === "cookieParser");
        stack.splice(
          index + 1,
          0,
          new Layer(
            "/",
            {
              strict: false,
              end: false,
            },
            async (req, res, next) => {
              // skip if URL is ignored
              if (ignoreAuthRegexp.test(req.url)) return next();

              // skip if user management is not set up yet
              if (!config.get("userManagement.isInstanceOwnerSetUp", false))
                return next();

              // skip if cookie already exists
              if (req.cookies?.["n8n-auth"]) return next();

              // if N8N_FORWARD_AUTH_HEADER is not set, skip
              if (!process.env.N8N_FORWARD_AUTH_HEADER) return next();

              // if N8N_FORWARD_AUTH_HEADER header is not found, skip
              const email =
                req.headers[process.env.N8N_FORWARD_AUTH_HEADER.toLowerCase()];
              if (!email) return next();

              // search for user with email
              let user = await this.dbCollections.User.findOneBy({ email });
              if (!user) {
                const owner = await this.dbCollections.User.findOne({
                  where: { role: "global:owner" },
                });
                const randomPassword = randomString(18);
                user = await this.dbCollections.User.createUserWithProject({
                  email: email,
                  firstName: email,
                  lastName: email,
                  role: owner ? "global:member" : "global:owner",
                  password: await passwordUtility.hash(randomPassword),
                }).then((resp) => resp.user);
              }
              if (!user) {
                res.statusCode = 401;
                res.end(
                  `User ${email} not found, please have an admin invite the user first.`,
                );
                return;
              }

              // issue cookie if all is OK
              authService.issueCookie(res, user);
              return next();
            },
          ),
        );
      },
    ],
  },
};
