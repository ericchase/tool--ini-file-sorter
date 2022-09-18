import { parse } from "https://deno.land/std/flags/mod.ts";
import { StringReader } from "https://deno.land/std@0.156.0/io/readers.ts?s=StringReader";
import { readLines } from "https://deno.land/std@0.156.0/io/mod.ts?s=readLines";
import { detect } from "https://deno.land/std@0.156.0/fs/eol.ts";

function newSetting() {
    return {
        comments: [],
        data: ''
    }
}

async function readIniFile(ini_data, path) {
    try {
        const original = await Deno.readTextFile(path)
        const eol = detect(original);

        ini_data.eol = eol;
        ini_data.original = original;

        //console.log(path);
        //console.log();
        //console.log('>>> Reading');
        //console.log();
        //console.log(ini_data.original);
        //console.log();
    } catch (error) {
        console.error(`${path}: error during file reading`);
        console.error(error);
        console.error();
        return false;
    }
    return true;
}

async function createSections(ini_data, path) {
    try {
        const sectionList = {};
        const unlistedSection = [newSetting()]
        let lastSection = unlistedSection;
        let lastSetting = unlistedSection[unlistedSection.length - 1];

        function addSectionHeader(line) {
            const header = line.slice(1, -1).trim();
            if (header in sectionList) { }
            else sectionList[header] = [];
            lastSection = sectionList[header];
            lastSection.push(lastSetting = newSetting());
        }

        function addSettingComment(line) {
            lastSetting.comments.push(line);
        }

        function addSettingData(line) {
            lastSetting.data = line;
            lastSection.push(lastSetting = newSetting());
        }

        for await (const line of readLines(new StringReader(ini_data.original))) {
            const trimmed = line.trim();
            if (trimmed.length < 1) continue;
            if (trimmed[0] === '[' && trimmed[trimmed.length - 1] === ']') {
                addSectionHeader(trimmed); continue;
            }
            if (trimmed[0] === ';') {
                addSettingComment(line); continue;
            }
            else {
                addSettingData(line);
            }
        }

        function cleanSection(section) {
            return section.filter(setting => setting.comments.length > 0 || setting.data !== '');
        }

        for (const key in sectionList) {
            sectionList[key] = cleanSection(sectionList[key]);
        }

        ini_data.sections = sectionList;
        ini_data.unlisted = cleanSection(unlistedSection);

        //console.log('>>> Analysis');
        //console.log();
        //console.log(ini_data.sections);
        //console.log();
        //console.log(ini_data.unlisted);
        //console.log();
    } catch (error) {
        console.error(`${path}: error during analysis`);
        console.error(error);
        console.error();
        return false;
    }
    return true;
}

async function sortIniContents(ini_data, path) {
    try {
        const sectionList = ini_data.sections;
        const unlistedSection = ini_data.unlisted;

        function getSortedSettings(section, header) {
            function getKey(setting) {
                return setting.data.trim();
            }

            const sortedKeys = section.map(getKey).filter(key => key !== '').sort();
            const endingComments = section.find(setting => getKey(setting) === '');
            const sortedSettings = [];
            if (header) {
                const headerLine = newSetting();
                headerLine.data = `[${header}]`;
                sortedSettings.push(headerLine);
            }
            for (const key of sortedKeys) {
                sortedSettings.push(section.find(setting => getKey(setting) === key));
            }
            if (endingComments) {
                sortedSettings.push(endingComments);
            }
            return sortedSettings;
        }

        function getSortedSections() {
            const sortedKeys = Object.keys(sectionList).sort();
            const sortedSections = [];
            if (unlistedSection.length > 0) {
                sortedSections.push(getSortedSettings(unlistedSection));
            }
            for (const key of sortedKeys) {
                sortedSections.push(getSortedSettings(sectionList[key], key));
            }
            return sortedSections;
        }

        const sortedSections = getSortedSections();
        const lines = [];
        for (const section of sortedSections) {
            for (const setting of section) {
                if (setting.comments.length > 0) lines.push(...setting.comments);
                if (setting.data !== '') lines.push(setting.data);
            }
            lines.push('');
        }

        ini_data.sorted = lines.join(ini_data.eol);

        //console.log('>>> Sorting');
        //console.log();
        //console.log(ini_data.sorted);
        //console.log();
    } catch (error) {
        console.error(`${path}: error during sorting`);
        console.error(error);
        console.error();
        return false;
    }
    return true;
}

async function writeIniFile(ini_data, path) {
    try {
        await Deno.writeTextFile(path, ini_data.sorted);
    } catch (error) {
        console.error(`${path}: error during file writing`);
        console.error(error);
        console.error();
        return false;
    }
    return true;
}

async function main(path) {
    const ini = {};
    if (await readIniFile(ini, path))
        if (await createSections(ini, path))
            if (await sortIniContents(ini, path))
                if (await writeIniFile(ini, path)) return true;
    return false;
}

const parsedArgs = parse(Deno.args, {});

if (parsedArgs._.length < 1) {
    console.log("No paths provided!");
    console.log("Attempting to load: ./test.ini");
    console.log();

    await main('./test.ini');
} else {
    const results = await Promise.allSettled(parsedArgs._.map(main));
    if (results.every(_ => _.status === "fulfilled" && _.value === true)) {
        Deno.exit(0);
    }
}

prompt("...");
Deno.exit(1);
