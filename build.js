import fs from "fs-extra";
import handlebars from "handlebars";
import webExt from "web-ext";


const extensions = [
    { name: "Overview", icon: "overview.png", urlSuffix: "", guid: "{6955d06d-99e4-41bf-add9-14bcdb99ae1b}" },
    { name: "Work Items", icon: "plan.png", urlSuffix: "_workitems", guid: "{a49290b8-292e-41c2-976d-c75b2a3c59d3}" },
    { name: "Git", icon: "repos.png", urlSuffix: "_git", guid: "{fb28f589-8cad-424e-aa48-962ed6691574}" },
    { name: "Pipelines", icon: "pipelines.png", urlSuffix: "_build", guid: "{91963394-6b51-43f2-9e29-b48b1716f548}" },
    { name: "Test Plans", icon: "tests.png", urlSuffix: "_testPlans", guid: "{44f9faff-afc1-4bbd-a194-cf8edee09e65}" },
    { name: "Artifacts", icon: "artifacts.png", urlSuffix: "_artifacts", guid: "{fd6eebf6-5f7e-44b6-a732-b8405e4f7d66}" }
];

const version = JSON.parse(fs.readFileSync("package.json", { encoding: "utf8" })).version;

const templateContent = fs.readFileSync("manifest.json.handlebars", { encoding: "utf8" });
const transformManifestTemplate = handlebars.compile(templateContent);

fs.emptyDirSync("dist/");
for (let extension of extensions) {
   extension = {...extension, version};

    const outDir = `dist/${extension.name}/`;
    fs.emptyDirSync(outDir);
    fs.copySync("template/", outDir);
    fs.copyFileSync(`icons/${extension.icon}`, `${outDir}/icon.png`);

    const manifest = transformManifestTemplate(extension);
    fs.writeFileSync(`${outDir}/manifest.json`, manifest);

    await webExt.cmd.build({ sourceDir: `dist/${extension.name}`, artifactsDir: "dist/" });
}

console.log(`\n  ---> ${extensions.length} extensions created in dist/\n`);