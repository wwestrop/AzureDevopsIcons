import process from "process";
import fs from "fs-extra";
import handlebars from "handlebars";
import zip from "jszip";
import webExt from "web-ext";
import { execSync } from "child_process";


const browsers = [
    {
        name: "firefox",
        format: "xpi",
        secret: { /* whatver as appopriate to this store */ },
        //sign: x => await call mozilla
    },
    {
        name: "chrome",
        format: "crx",
        secret: { /* whatver as appopriate to this store */ },
        //sign: x => await call google
    }
];

const extensions = [
    { name: "Overview", icon: "overview.png", urlSuffix: "", guid: "{6955d06d-99e4-41bf-add9-14bcdb99ae1b}" },
    { name: "Work Items", icon: "plan.png", urlSuffix: "_workitems", guid: "{304a4a6a-8af1-4db3-9483-afabcd1aef5b}" },
    { name: "Git", icon: "repos.png", urlSuffix: "_git", guid: "{a7db9a67-7e24-40f3-88ad-6117febfaba1}" },
    { name: "Pipelines", icon: "pipelines.png", urlSuffix: "_build", guid: "{91963394-6b51-43f2-9e29-b48b1716f548}" },
    { name: "Test Plans", icon: "tests.png", urlSuffix: "_testPlans", guid: "{44f9faff-afc1-4bbd-a194-cf8edee09e65}" },
    { name: "Artifacts", icon: "artifacts.png", urlSuffix: "_artifacts", guid: "{a514e12a-c40d-4549-9541-79e72f0b3226}" }
];

const version = await versionArtifact();

execSync("npm install");

for (const browser of browsers) {
    await build(browser);
}

async function build(browser) {

    let extensions2 = extensions;
    if (browser.name === "chrome") {
        // HACK
        extensions2 = [ { name: "icons", icon: "pipelines.png" } ];
    }

    const manifestFile = `manifest-${browser.name}.json.handlebars`;
    console.log(`Building for ${browser.name} from '${manifestFile}'...\n`);

    const templateContent = await fs.readFile(manifestFile, { encoding: "utf8" });
    const transformManifestTemplate = handlebars.compile(templateContent);

    await fs.emptyDir(`dist/${browser.name}/`);
    for (let extension of extensions2) {
        extension = {...extension, version};

        const outDir = `dist/${browser.name}/${extension.name}/`;
        await fs.emptyDir(outDir);
        await fs.copy(`template/${browser.name}/`, outDir);
        await fs.copyFile(`icons/${extension.icon}`, `${outDir}/icon.png`);

        const manifest = transformManifestTemplate(extension);
        await fs.writeFile(`${outDir}/manifest.json`, manifest);

        await webExt.cmd.build({ sourceDir: `dist/${browser.name}/${extension.name}`, artifactsDir: `dist/${browser.name}` });
    }

    if (process.env["WEB_EXT_API_KEY"] && process.env["WEB_EXT_API_SECRET"]) {
        const signTasks = extensions2.map(extension => webExt.cmd.sign({
            apiKey: process.env["WEB_EXT_API_KEY"],
            apiSecret: process.env["WEB_EXT_API_SECRET"],
            channel: "unlisted",            // if you don't do this, despite being called "sign", it will actually publish it
                                            // But not give you the XPI
                                            // "Your add-on has been submitted for review. It passed validation but could not be automatically signed because this is a listed add-on."
            sourceDir: `dist/${browser.name}/${extension.name}`, 
            artifactsDir: `dist/${browser.name}`
        }));

        await Promise.all(signTasks);
    }

    await createPackage(browser, version);

    console.log(`\n  ---> ${extensions2.length} extensions created in dist/${browser.name}\n\n`);



    async function createPackage(browser, version) {

        if (browser.name === "chrome") {
            // HACK
            // Chrome comes as one extension, no need to collect them all.
            // However the default filename needs distinguishing from Fx,
            // otherwise one will overwrite the other when uploaded to GH release
            // const rFile = `chrome_azure_devops_icons-${version}.zip`; // chrome_azure_devops_icons-1.0.93.zip
            await fs.move(`dist/chrome/azure_devops_icons-${version}.zip`, `dist/chrome/chrome_azure_devops_icons-${version}.zip`);
            return;
        }

        console.log("Packaging...");
    
        var zipFile = new zip();
        const fileNames = extensions.map(e => `azure_devops_icon_${e.name.toLowerCase().replace(" ", "_")}_-${version}.zip`);
    
        for (const fileName of fileNames) {
            const fileData = fs.readFileSync(`dist/${browser.name}/${fileName}`);
            zipFile.file(fileName, fileData);
        }
    
        zipFile.generateNodeStream({ type: "nodebuffer", streamFiles: true })
            .pipe(fs.createWriteStream(`dist/${browser.name}/${browser.name}_azure_devops_icons-${version}.zip`));
    }

}

async function versionArtifact() {
    let version = JSON.parse(await fs.readFile("package.json", { encoding: "utf8" })).version;

    if (process.env["GITHUB_RUN_NUMBER"]) {
        const versionPrefix = version.substr(0, version.lastIndexOf("."));
        
        version = `${versionPrefix}.${process.env["GITHUB_RUN_NUMBER"]}`;
    }

    if (process.env["GITHUB_OUTPUT"]) {
        fs.appendFile(process.env["GITHUB_OUTPUT"], `PKG_VERSION=${version}\n`);      // For GitHub runner
    }

    console.log(`Artifact version will be ${version}\n\n`);
    return version;
}