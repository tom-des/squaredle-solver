solveButton = document.querySelector('#solve-button')
solveButton.addEventListener('click', solver)
solveButton.addEventListener('click', ()=>{
    if (solveButton.textContent == "Get Solutions") {
        solveButton.textContent = "Solving..."
    }
})

let rows = [

    ['S', 'Q', 'U'],
    ['A', 'R', 'D'],
    ['L', 'E', 'S'],

]

function toggleAvail(row, col, status) {

    if (status === "true") {
        availArray[row][col] = true
    } else if (status === "false") {
        availArray[row][col] = false
    }

}

function createGameboard(rows) {

    gameboardElem = document.querySelector('#gameboard')

    for (let i = 0; i < rows.length; i++) {

        rowElem = document.createElement('div')
        rowElem.className = "row"
        rowElem.dataset.row = i
        gameboardElem.appendChild(rowElem)

        for (let j = 0; j < rows[0].length; j++) {
            tileElem = document.createElement('div')
            tileElem.className = "tile"
            tileElem.id = "index" + i + j
            if (tileElem.textContent = rows[i][j] == '') {
                tileElem.textContent = "X"
                tileElem.style.color = "black"
            } else {
                tileElem.textContent = rows[i][j]
            }
            tileElem.dataset.col = j

            tileElem.dataset.avail = "true"
            rowElem.appendChild(tileElem)

        }
    }
}

let rowCount = rows.length
let colCount = rows[0].length
let availArray = []

for (let i = 0; i < rowCount; i++) {
    availArray.push([])
    for (let j = 0; j < colCount; j++) {
        availArray[i].push(true)
    }
}

let solutionArray = []
let solutionLettersArray = []
let currentLettersArray = []
let currentWord = []

createGameboard(rows)

async function createDictionary() {
    let response = await fetch("dictionary.txt")
    let dictionaryString = await response.text()
    dictionary = dictionaryString.split('\n')
    dictionary = dictionary.filter(word => word.length >= 4)
}

async function solver() {

    await createDictionary()
    startTime = Date.now()

    function removeTile(row, col) {

        currentWord.pop()
        currentLettersArray.pop()
        toggleAvail(row, col, "true")

    }

    // Each time this is called, a new letter cycle starts.

    function getNextTile(row, col) {

        if (rows[row][col] === '') {
            return
        }

        toggleAvail(row, col, "false")

        let nextLetter
        let colMod
        let rowMod
        let rowMods = [-1, -1, -1, 0, 1, 1, 1, 0]
        let colMods = [-1, 0, 1, 1, 1, 0, -1, -1]
        let newCol
        let newRow

        // If this is the first iteration, initialize current letter.

        if (currentWord.length < 1) {
            currentWord.push(rows[row][col])
            currentLettersArray.push(`${row}${col}`)
        }

        // Find all possible words eminating from tile.

        for (let i = 0; i < 9; i++) {

            // If the last round was the last round in the cycle, remove an extra letter and go to next round.

            if (i == 8) {
                removeTile(row, col)
                continue
            }

            // Define row and column modifiers.

            rowMod = rowMods[i]
            colMod = colMods[i]

            // Define row and column values for the next tile.

            newRow = row + rowMod
            newCol = col + colMod

            // Catch and throw away invalid tiles (off the gameboard, not available, empty value).

            let isValidRowCol = newRow >= 0 && newCol >= 0 && newCol < colCount && newRow < rowCount
            let isValidTile = isValidRowCol && availArray[newRow][newCol] === true && rows[newRow][newCol] !== ""

            if (!isValidTile) {
                continue
            }

            // Define next letter based on row and column values.

            nextLetter = rows[newRow][newCol]

            toggleAvail(newRow, newCol, "false")

            // Add next letter to running word and perform dictionary filtering based on current letters. 

            currentWord.push(nextLetter) 
            currentLettersArray.push(`${newRow}${newCol}`)
            newDict = dictionary.filter(word => currentWord.join('') === word.substring(0, currentWord.length))

            console.log(newDict) 
            console.log(currentWord) 

            joinedCurrentWord = currentWord.join('')


            // Find out if the last check was a new solution and log it out.

            let isValidWord = newDict[0] === joinedCurrentWord

            if (isValidWord) {
                isNewValidWord = solutionArray.indexOf(joinedCurrentWord) === -1
            } else {
                isNewValidWord = false
            }

            if (isValidWord) {

                console.log("Solution! " + joinedCurrentWord)
                solutionArray.push(joinedCurrentWord)
                solutionLettersArray.push(currentLettersArray.join(','))

            }

            // If there are no words in the dictionary, remove last tile and continue with the cycle.

            if (newDict.length == 0 || newDict.length === 1 && isValidWord) {
                removeTile(newRow, newCol)
            }

            // Else: (if there are words in the dictionary still) get the next tile.

            else {
                getNextTile(newRow, newCol)


            }
        }
    }

    // Run through every available tile.

    for (let l = 0; l < rowCount; l++) {

        for (let m = 0; m < colCount; m++) {

            getNextTile(l, m)

        }
    }

    // Remove duplicates from solutions (shouldn't be any, can probably cut this), sort alphabetically, and log out.

    console.log(solutionArray)
    gameboardElem = document.querySelector("#game-elements")
    wordListContainerElem = document.createElement("div")
    wordListContainerElem.id = "word-list"
    gameboardElem.appendChild(wordListContainerElem)

    wordListContainerElem = document.querySelector("#word-list")
    wordListElem = document.createElement("ol")
    wordListContainerElem.appendChild(wordListElem)
    solutionArray.forEach((item, index) => {
        listItem = document.createElement("li")
        listItem.dataset.tiles = solutionLettersArray[index]
        listItem.textContent = item
        listItem.addEventListener("mouseover", (e) => colorWord(e))
        listItem.addEventListener("mouseout", (e) => colorWord(e, "black"))
        wordListElem.appendChild(listItem)

    })

    wordListContainerElem.appendChild(wordListElem)

    endTime = Date.now()
    runTime = endTime - startTime
    console.log("Runtime was " + (runTime / 1000) + " seconds.")
    solveButton.style.display = 'none'
}

function generateRandomInteger(max) {
    return Math.floor(Math.random() * max) + 1;
}

function colorWord(e, color) {
    elem = e.target
    if (!color) {
        colors = ["red", "blue", "green", "purple"]
        colorNum = generateRandomInteger(colors.length - 1)
        color = colors[colorNum]

    }

    elem.style.backgroundColor = color
    tileNums = elem.dataset.tiles
    tileNums = tileNums.split(",")
    tileNums.forEach(tile => {
        tileElem = document.querySelector("#index" + tile)
        tileElem.style.backgroundColor = color
    })

}