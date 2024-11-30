jest.setTimeout(30000);

const puppeteer = require('puppeteer');
const { query} = require('../control/dbmanager.js');


describe('Step 2', () => {
    const db_selected_1 = 0;
    const db_selected_2 = 1;
    const ids = ['20', '20'];
    const testName1 = 'write-write test again';

    let queryGameBefore2010, queryGameDuringAfter2010;
    let newQueryGameBefore2010, newQueryGameDuringAfter2010;
    let latestQueryGameBefore2010, latestQueryGameDuringAfter2010;

    test('Case 3, Write-Write Concurrency Test.', async () => {
        console.log('Starting test for Write-Write Concurrency...');
        
        latestQueryGameBefore2010 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[0]], 'READ');
        console.log("8: Latest Query Game Before 2010", latestQueryGameBefore2010);

        latestQueryGameDuringAfter2010 = await query(db_selected_2)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[1]], 'READ');
        console.log("9: Latest Query Game During/After 2010", latestQueryGameDuringAfter2010);

        expect(latestQueryGameBefore2010[0].Name).not.toEqual(newQueryGameBefore2010[0].Name);
        expect(latestQueryGameDuringAfter2010[0].Name).not.toEqual(newQueryGameDuringAfter2010[0].Name);

        expect(latestQueryGameBefore2010[0].Name).toEqual(queryGameBefore2010[0].Name);
        expect(latestQueryGameDuringAfter2010[0].Name).toEqual(queryGameDuringAfter2010[0].Name);

        console.log("10: Test Assertions Passed");
    });


    beforeAll(async () => {
        queryGameBefore2010 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[0]], 'READ');
        console.log("1: Initial Query Game Before 2010", queryGameBefore2010);

        queryGameDuringAfter2010 = await query(db_selected_2)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[1]], 'READ');
        console.log("2: Initial Query Game During/After 2010", queryGameDuringAfter2010);

        newQueryGameBefore2010 = await query(db_selected_1)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[0]], 'READ');
        console.log("3: New Query Game Before 2010", newQueryGameBefore2010);

        newQueryGameDuringAfter2010 = await query(db_selected_2)("SELECT * FROM GAME_TABLE WHERE AppID = ?", [ids[1]], 'READ');
        console.log("4: New Query Game During/After 2010", newQueryGameDuringAfter2010);

        newQueryGameBefore2010[0].Name = testName1;
        newQueryGameDuringAfter2010[0].Name = testName1;
        const width = 1280; 
        const height = 720; 
        const windowSize = '--window-size=' + width + ',' + height; 
        const slowMo = 0; 
        const browserConfig = {
            headless: false, 
            slowMo: slowMo, 
            args: [windowSize] 
        };

        const browsers = [
            await puppeteer.launch(browserConfig),
            await puppeteer.launch(browserConfig), 
            await puppeteer.launch(browserConfig), 
            await puppeteer.launch(browserConfig) 
        ];

        const pages = [
            [   
                (await browsers[0].pages())[0], // Browser for read operation
                (await browsers[1].pages())[0]  // Browser for update operation
            ],
            [   // Vismin node
                (await browsers[2].pages())[0], // Browser for read operation
                (await browsers[3].pages())[0]  // Browser for update operation
            ]
        ];

        for (var i = 0; i < 2; i++) { 
            for (var j = 0; j < 2; j++) { 
                await pages[i][j].goto('http://localhost:3000/'); 
                await pages[i][j].setViewport({ width: width, height: height }); 
                await pages[i][j].click('#update'); 
                await pages[i][j].locator('#update-id').fill(ids[i]); 
                await pages[i][j].locator('#update-gameTitle').fill(testName1);
                await pages[i][j].evaluate(() => {
                    const dateInput = document.querySelector('#releasedDate');
                    dateInput.value = '2024-12-01'; 
                    dateInput.dispatchEvent(new Event('input')); 
                    dateInput.dispatchEvent(new Event('change')); 
                }); 
                await pages[i][j].locator('#price').fill('300'); 
                await pages[i][j].evaluate(() => {
                    const dropdown = document.querySelector('select.inputString');
                    dropdown.value = '0-0';
                    dropdown.dispatchEvent(new Event('change'));
                });
                                
                await pages[i][j].locator('#posReview').fill('300');
                await pages[i][j].locator('#negReview').fill('300'); 
            
            }
        }
        await new Promise(resolve => setTimeout(resolve, 4000));

        pages[0][1].click('#update-button'); 
        pages[0][0].click('#update-button');   
        pages[1][1].click('#update-button'); 
        pages[1][0].click('#update-button');   

        await pages[1][1].waitForNetworkIdle(200);
        await new Promise(resolve => setTimeout(resolve, 4000));

        browsers[0].close();
        browsers[1].close();
        browsers[2].close();
        browsers[3].close();
        
    });
}, 30000);