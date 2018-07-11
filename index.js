'use strict';
const https = require('https');

class DeployNewRelicPluginError extends Error {}

class DeployNewRelicPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.applicationId = this.serverless.service.custom['serverless-deploy-newrlic'].application_id;
    this.adminApiKey = this.serverless.service.custom['serverless-deploy-newrlic'].admin_api_key;
    if (!this.applicationId || !this.adminApiKey) {
      throw new DeployNewRelicPluginError('applicationId and adminApiKey must be defined');
    }

    this.hooks = {
      'after:deploy:deploy': this.callNewRelic.bind(this),
    };
  }

  callNewRelic() {
    const options = {
      hostname: 'api.newrelic.com',
      port: 443,
      path: `/v2/applications/${this.applicationId}/deployments.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key' : this.adminApiKey,
      }
    };
    this.serverless.cli.log('Recording new deployment');
    const postData = JSON.stringify({
      deployment : {
        revision: 'blah',
        description: "some description",
      },
    });
    const req = https.request(options, (res) => {
      res.on('data', (data) => {
        this.serverless.cli.log(`New Relic response: ${data}`);
      })
    });

    req.on('error', (e) => {
      this.serverless.cli.error('Error when calling New Relic: ', e);
    });

    req.write(postData);
    req.end();
  }
}
module.exports = DeployNewRelicPlugin;
