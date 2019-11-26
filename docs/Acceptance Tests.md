# Running Acceptance Tests

For Omega we use Protractor to run our automated Smoke, Acceptance and Regression tests.

## Install

### Install Java

Open a browser to the following URL: **https://java.com/en/download**

Download and install the correct version of Java for your machine.

### Install Protractor

```
npm install -g protractor mocha
npm install chai chai-as-promised
```

To make sure that Protractor is installed by running `Protractor --version`.

> If you ever update your version of Node then you will need to re-install Protractor and Mocha: 
```
npm install -g protractor mocha
```

#### Download needed files

Use `webdriver-manager` to download the necessary binaries for Selenium Server: 

```
webdriver-manager update --chrome --ie --gecko --ignore_ssl
```

If you are testing on windows you will also need to get the WebDriver for Microsoft Edge.

* [Download Microsoft Edge WebDriver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver) 

Place the executable file in a know location on your computer. _You will need the path for this file later._

In your project's `test/protractor` folder add the file `protractor.conf.js`:

> NOTE: Mike will probably place the protractor config in the Omega project and provide a simpler way to use it.

```js
const chromeArgs = [ "--headless", "--disable-gpu", "--window-size=800,600" ];
const firefoxArgs = [ "--headless" ];

const config = {
  framework: 'mocha',
  mochaOpts: {
    reporter: 'spec',
    timeout: 4000
  },
  multiCapabilities: [
    {
      browserName: 'chrome',
      chromeOptions: {
       args: chromeArgs 
      }
    }
  ],
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['*-spec.js']
};

if (useFireFox) {
  config
    {
      browserName: 'firefox',
      'moz:firefoxOptions': {
         args: firefoxArgs
       }
    }
}

exports.config = config;
```

### SSL Certificates

> Need more info - 2018/08/30 - Mike Collins

Omega has a default set of certificate files that are used for HTTPS/SSL communications.

If you need to generate new certificates then run the following like from Linux or 'Linux on Windows':

```
openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out cert.pem
```

Then move `key.pem` and `cert.pem` into the `.cert` folder of the Omega project.

#### Saving the certificates for IE and Edge Testing

If you are testing on Internet Explorer 11 or Microsoft Edge then you will need to accept the current certificates to allow protector to function with these browsers:

1. Open Internet Explorer 11 and browse to your local Omega application: `localhost:3000`.
1. The browser should complain that "This site is not secure".
1. Click on `More Info`.
1. Click on `Go on to the webpage (not recommended)` This should take you to `https://localhost:3001/ui`.
1. Click in the address bar on `Certificate Error`.
1. Click on `View Certificates`.
1. Click on `Install Certificate...`.
1. Select `Local Machine` radio button and click `Next`.
1. Windows will ask if you really want to allow the app to make changes. Click `Yes`.
1. Select `Place all certificates in the following store` and click `Browse`.
1. Select `Trusted Root Certification Authorities` and click `OK`.
1. Click `Next`.
1. Click `Finish`.
1. The browser should indicate that "the import was successful".
1. Click `OK`.
1. Close the IE browser and open it again.
1. Navigate back to your local instance of node: `localhost:3000`.
1. The browser should be happy and you should be on the page `https://localhost:3001/ui` without a certificate error.

### Running Protractor Tests

To run the Protractor tests you need to run three things.

1. The Protractor server (Which runs Selenium Server.)
2. Your Omega/Node application.
3. Your Protractor tests

#### Starting Protractor 

##### Running tests on Windows

To start the Protractor server on Windows run this command in your shell:

```
webdriver-manager start --chrome --ie --gecko --ignore_ssl --edge "C:\<Path to Edge WebDriver>\MicrosoftWebDriver.exe"
```

##### Running tests on Linux

To start the Protractor server on Linux run this command in your shell:

```
webdriver-manager start --chrome --gecko --ignore_ssl"
```

### Starting your Omega App

After starting the Protractor server you need another shell to run your app:

```
node app
```

### Starting your tests

Once the Protractor server and your Omega app are running you can run your tests:

```
protractor test/protractor/protractor.conf.js
```

## Protractor Docs

* [Protractor Main Website](https://www.protractortest.org)
* [Protractor Docs Table of Contents](https://www.protractortest.org/#/toc)
* [Protractor API](http://www.protractortest.org/#/api)

* [WebDriver Manager](https://github.com/angular/webdriver-manager/blob/master/README.md)

