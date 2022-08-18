import processv from "process";
import fs from "fs-extra";
import handlebars from "handlebars";
import zip from "jszip";
import webExt from "web-ext";

const browsers = ["firefox", "chrome"];


const extensions = [
    { name: "Overview", icon: "overview.png", urlSuffix: "", guid: "{6955d06d-99e4-41bf-add9-14bcdb99ae1b}" },
    { name: "Work Items", icon: "plan.png", urlSuffix: "_workitems", guid: "{304a4a6a-8af1-4db3-9483-afabcd1aef5b}" },
    { name: "Git", icon: "repos.png", urlSuffix: "_git", guid: "{a7db9a67-7e24-40f3-88ad-6117febfaba1}" },
    { name: "Pipelines", icon: "pipelines.png", urlSuffix: "_build", guid: "{91963394-6b51-43f2-9e29-b48b1716f548}" },
    { name: "Test Plans", icon: "tests.png", urlSuffix: "_testPlans", guid: "{44f9faff-afc1-4bbd-a194-cf8edee09e65}" },
    { name: "Artifacts", icon: "artifacts.png", urlSuffix: "_artifacts", guid: "{a514e12a-c40d-4549-9541-79e72f0b3226}" }
];

const version = JSON.parse(await fs.readFile("package.json", { encoding: "utf8" })).version;
console.log(`::set-output name=PKG_VERSION::${version}`);    // For GitHub runner

for (const browser of browsers) {
    await build(browser);
}

async function build(browser) {

    const manifestFile = `manifest-${browser}.json.handlebars`;
    console.log(`Building for ${browser} from '${manifestFile}'...\n`);

    const templateContent = await fs.readFile(manifestFile, { encoding: "utf8" });
    const transformManifestTemplate = handlebars.compile(templateContent);

    await fs.emptyDir(`dist/${browser}/`);
    for (let extension of extensions) {
        extension = {...extension, version};

        const outDir = `dist/${browser}/${extension.name}/`;
        await fs.emptyDir(outDir);
        await fs.copy(`template/${browser}/`, outDir);
        await fs.copyFile(`icons/${extension.icon}`, `${outDir}/icon.png`);

        const manifest = transformManifestTemplate(extension);
        await fs.writeFile(`${outDir}/manifest.json`, manifest);

        await webExt.cmd.build({ sourceDir: `dist/${browser}/${extension.name}`, artifactsDir: `dist/${browser}` });

        if (process.env["WEB_EXT_API_KEY"] && process.env["WEB_EXT_API_SECRET"]) {
            await webExt.cmd.sign({
                apiKey: process.env["WEB_EXT_API_KEY"],
                apiSecret: process.env["WEB_EXT_API_SECRET"],
                sourceDir: `dist/${browser}/${extension.name}`, 
                artifactsDir: `dist/${browser}`
            });
        }
    }

    createPackage();

    console.log(`\n  ---> ${extensions.length} extensions created in dist/${browser}\n\n`);



    function createPackage() {
        console.log("Packaging...");
    
        var zipFile = new zip();
        const fileNames = extensions.map(e => `azure_devops_icon_${e.name.toLowerCase().replace(" ", "_")}_-${version}.zip`);
    
        for (const fileName of fileNames) {
            const fileData = fs.readFileSync(`dist/${browser}/${fileName}`);
            zipFile.file(fileName, fileData);
        }
    
        zipFile.generateNodeStream({ type: "nodebuffer", streamFiles: true })
            .pipe(fs.createWriteStream(`dist/${browser}/azure_devops_icons_${version}.zip`));
    }

}
