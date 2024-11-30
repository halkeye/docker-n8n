// From https://community.n8n.io/t/self-hosted-user-management/30520
const { dirname, resolve } = require("path");
const Layer = require("express/lib/router/layer");
// const basicAuth = require("basic-auth");
const { issueCookie } = require(
  resolve(dirname(require.resolve("n8n")), "auth/jwt"),
);
const Container = require("typedi");

// const basicAuthCredentials = {
//   username: process.env.N8N_BASIC_AUTH_USER,
//   password: process.env.N8N_BASIC_AUTH_PASSWORD,
// };
//
// const ignoreAuthRegexp = /^\/(assets|healthz|webhook)/;

module.exports = {
  n8n: {
    ready: [
      async function ({ app }, config) {
        await this.dbCollections.Settings.update(
          { key: "userManagement.isInstanceOwnerSetUp" },
          { value: JSON.stringify(true) },
        );

        config.set("userManagement.isInstanceOwnerSetUp", true);

        const { stack } = app._router;

        // if (basicAuthCredentials.username && basicAuthCredentials.password) {
        //   stack.unshift(
        //     new Layer(
        //       "/",
        //       {
        //         strict: false,
        //         end: false,
        //       },
        //       async (req, res, next) => {
        //         if (ignoreAuthRegexp.test(req.url)) return next();
        //
        //         const authorization = basicAuth(req);
        //         if (
        //           !authorization ||
        //           authorization.name !== basicAuthCredentials.username ||
        //           authorization.pass !== basicAuthCredentials.password
        //         ) {
        //           res.statusCode = 401;
        //           res.setHeader("WWW-Authenticate", 'Basic realm="n8n"');
        //           res.end("Access denied");
        //         } else {
        //           next();
        //         }
        //       },
        //     ),
        //   );
        // }

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
              console.log(
                "X-authentik-email",
                req.headers?.["x-authentik-email"],
              );
              if (!req.cookies?.["n8n-auth"]) {
                const owner = await this.dbCollections.User.findOne({
                  where: { role: "global:owner" },
                });
                issueCookie(res, owner);
              }

              next();
            },
          ),
        );

        console.log("UM Disabled");
      },
    ],
  },
};
