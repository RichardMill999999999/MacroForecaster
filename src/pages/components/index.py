import json

# Load the JSON file
with open('./headerNavigationMenu.json', 'r') as file:
    teams = json.load(file)

# Iterate over each team and create a JSX file
for team in teams:
    name = team['name']
    CID = team['CID']
    content = f"import React from 'react';\n\nfunction {CID}() {{\n    return (\n        <div>\n            <h1>{name}</h1>\n            {{/* Add your component content here */}}\n        </div>\n    );\n}}\n\nexport default {CID};"

    # Write content to JSX file
    with open(f'teams/{CID}.jsx', 'w') as jsx_file:
        jsx_file.write(content)
    print(f"Archivo {CID}.jsx generado.")
