# tool--ini-file-sorter
[unlicensed] Tool for sorting the contents of .ini files.

## Running
This program is written for the __[Deno](https://deno.land/)__ JavaScript engine.  
You will need the `deno.exe` executable to run and compile the code.

## Demo
Open or drag a file onto `drag-and-drop-demo.bat` for quick demonstration.

## Format
The __[INI](https://en.wikipedia.org/wiki/INI_file)__ file format is not rigidly defined, as it was meant to be a quick and loose way to manage configuration settings for literally anything.

As of today, we typically see 3 parts to .ini files: _settings_, _sections_, and _comments_. This formatter relies on a minimal but strict set of rules.

__Sections__: lines that start with __`[`__ and end with __`]`__, ignoring whitespace.
- Any comments and settings preceding the first section are considered to be in a temporary section and kept at the top of the file.
- Sections are sorted amongst each other in lexicographical order.
- A blank line is added after each section.

__Comments__: lines that start with __`;`__, ignoring whitespace.
- Comments that precede a setting are kept together with that setting.
- Comments that appear after all the settings of the residing section will stay at bottom of that section.
- Any blank lines between comments are removed.

__Settings__: all other lines that are not blank.
- Strictly speaking, settings are denoted by an `=` character. However, this program does not check for that character.
- Settings are sorted amongst each other within the same section in lexicographical order.
- Any blank lines between settings are removed.
