'use strict';

/*global require*/
var UserInterface = require('./UserInterface.jsx');
var React = require('react');
var ReactDOM = require('react-dom');
// require('babel-polyfill');

var terriaOptions = {
    baseUrl: 'build/TerriaJS'
};
var configuration = {
    bingMapsKey: undefined, // use Cesium key
};

// Check browser compatibility early on.
// A very old browser (e.g. Internet Explorer 8) will fail on requiring-in many of the modules below.
// 'ui' is the name of the DOM element that should contain the error popup if the browser is not compatible
//var checkBrowserCompatibility = require('terriajs/lib/ViewModels/checkBrowserCompatibility');

// checkBrowserCompatibility('ui');


var isCommonMobilePlatform = require('terriajs/lib/Core/isCommonMobilePlatform');
var TerriaViewer = require('terriajs/lib/ViewModels/TerriaViewer');
var registerKnockoutBindings = require('terriajs/lib/Core/registerKnockoutBindings');
var GoogleAnalytics = require('terriajs/lib/Core/GoogleAnalytics');

var GoogleUrlShortener = require('terriajs/lib/Models/GoogleUrlShortener');
var updateApplicationOnHashChange = require('terriajs/lib/ViewModels/updateApplicationOnHashChange');
var updateApplicationOnMessageFromParentWindow = require('terriajs/lib/ViewModels/updateApplicationOnMessageFromParentWindow');
var ViewState = require('terriajs/lib/ReactViewModels/ViewState').default;

var Terria = require('terriajs/lib/Models/Terria');
var registerCatalogMembers = require('terriajs/lib/Models/registerCatalogMembers');
var registerCustomComponentTypes = require('terriajs/lib/Models/registerCustomComponentTypes');
// var registerAnalytics = require('terriajs/lib/Models/registerAnalytics');
var raiseErrorToUser = require('terriajs/lib/Models/raiseErrorToUser');

var GoogleUrlShortener = require('terriajs/lib/Models/GoogleUrlShortener');
var isCommonMobilePlatform = require('terriajs/lib/Core/isCommonMobilePlatform');
var GoogleAnalytics = require('terriajs/lib/Core/GoogleAnalytics');

var OgrCatalogItem = require('terriajs/lib/Models/OgrCatalogItem');
//import DisclaimerHandler from 'terriajs/lib/ReactViewModels/DisclaimerHandler';
import defined from 'terriajs-cesium/Source/Core/defined';


// Tell the OGR catalog item where to find its conversion service.  If you're not using OgrCatalogItem you can remove this.
OgrCatalogItem.conversionServiceBaseUrl = configuration.conversionServiceBaseUrl;

// Register custom Knockout.js bindings.  If you're not using the TerriaJS user interface, you can remove this.
registerKnockoutBindings();


// Register all types of catalog members in the core TerriaJS.  If you only want to register a subset of them
// (i.e. to reduce the size of your application if you don't actually use them all), feel free to copy a subset of
// the code in the registerCatalogMembers function here instead.
registerCatalogMembers();

// registerAnalytics();

terriaOptions.analytics = new GoogleAnalytics();

// Construct the TerriaJS application, arrange to show errors to the user, and start it up.
var terria = new Terria(terriaOptions);

// Register custom components in the core TerriaJS.  If you only want to register a subset of them, or to add your own,
// insert your custom version of the code in the registerCustomComponentTypes function here instead.
registerCustomComponentTypes(terria);

terria.welcome = '<h3>AREMI - The Australian Renewable Energy Mapping Infrastructure</h3><div><p>We are focused on supporting Renewable Energy development in Australia by simplifying access to energy resource and infrastructure spatial data.</p><p>AREMI is developed by Data61, in partnership with Geoscience Australia and the Clean Energy Council, with funding support provided by the Australian Renewable Energy Agency (ARENA).</p></div>';

const viewState = new ViewState();

terria.error.addEventListener(e => {
    viewState.notifications.push({
        title: e.title,
        message: e.message
    });
});

//const disclaimerHandler = new DisclaimerHandler(terria, viewState);

terria.start({
    // If you don't want the user to be able to control catalog loading via the URL, remove the applicationUrl property below
    // as well as the call to "updateApplicationOnHashChange" further down.
    applicationUrl: window.location,
    configUrl: 'config.json',
    defaultTo2D: isCommonMobilePlatform(),
    urlShortener: new GoogleUrlShortener({
        terria: terria
    })
}).otherwise(function(e) {
    raiseErrorToUser(terria, e);
}).always(function() {
    try {
        configuration.bingMapsKey = terria.configParameters.bingMapsKey ? terria.configParameters.bingMapsKey : configuration.bingMapsKey;

        // Automatically update Terria (load new catalogs, etc.) when the hash part of the URL changes.
        updateApplicationOnHashChange(terria, window);
        updateApplicationOnMessageFromParentWindow(terria, window);

        // Create the map/globe.
        var terriaViewer = TerriaViewer.create(terria, {
            developerAttribution: {
                text: 'Data61',
                link: 'http://www.csiro.au/en/Research/D61'
            }
        });

        //temp
        var createAustraliaBaseMapOptions = require('terriajs/lib/ViewModels/createAustraliaBaseMapOptions');
        var createGlobalBaseMapOptions = require('terriajs/lib/ViewModels/createGlobalBaseMapOptions');
        var selectBaseMap = require('terriajs/lib/ViewModels/selectBaseMap');
        // Create the various base map options.
        var australiaBaseMaps = createAustraliaBaseMapOptions(terria);
        var globalBaseMaps = createGlobalBaseMapOptions(terria, configuration.bingMapsKey);

        var allBaseMaps = australiaBaseMaps.concat(globalBaseMaps);
        //selectBaseMap(terria, allBaseMaps, 'Positron (Light)', true);
				selectBaseMap(terria, allBaseMaps, 'Australian Wave Atlas', true);

        // Add the disclaimer, if specified
        if (defined(terria.configParameters.globalDisclaimer)) {
            var disclaimer = terria.configParameters.globalDisclaimer;
            if (defined(disclaimer.enabled) && disclaimer.enabled) {
                var message = '';
                /* disabling the dev disclaimer for the UX testing
                if (location.hostname.indexOf('nationalmap.gov.au') === -1) {
                    message += fs.readFileSync(__dirname + '/lib/Views/DevelopmentDisclaimer.html', 'utf8');
                }
                */
                message += require('./lib/Views/GlobalDisclaimer.html');
                var options = {
                    title: defined(disclaimer.title) ? disclaimer.title : 'Disclaimer',
                    confirmText: 'I Agree',
                    width: 600,
                    height: 550,
                    message: message
                };

                viewState.notifications.push(options);
            }
        }

        // Automatically update Terria (load new catalogs, etc.) when the hash part of the URL changes.
        // updateApplicationOnHashChange(terria, window);
        ReactDOM.render(<UserInterface terria={terria} allBaseMaps={allBaseMaps}
                                       terriaViewer={terriaViewer}
                                       viewState={viewState}/>, document.getElementById('ui'));
    } catch (e) {
        console.error(e);
        console.error(e.stack);
    }
});
