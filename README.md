# Selenium Batch Converter

Quick Use:
```
npm install && npm start "input/directory" "output/directory"
```

 - input/
   - directory/
     - foo.html
     - bar.html
 - output/
   - directory/
     - foo.cs
     - bar.cs

## What it does

This tool is responsible for doing batch conversions of Selenium IDE
recorded tests.

### Formatters

Currently there is only a C#/Webdriver formatter, but it should be easy to 
port other formats from Selenium IDE.
