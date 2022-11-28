// Define solve button elem and add event listeners
solveButton = document.querySelector('#solve-button')
solveButton.addEventListener('click', solver)

// Define input elems and add event listeners
let enterGameElem = document.querySelector('#enter-board')
let boardSizeElem = document.querySelector('#board-size')
enterGameElem.addEventListener('input', () => {
    let inputValue = enterGameElem.value
    if(inputValue.match(/[^a-zA-Z]/g)) {
        boardSizeElem.textContent = "Only letters are allowed"
        boardSizeElem.style.color = "red"
        solveButton.style.display = "none"
        return
    }
    solveButton.style.display = "block"
    boardSizeElem.style.color = "white"
    let length = inputValue.length
    if (length == 16) {
        boardSizeElem.textContent = "You've entered a 4x4 board!"
    }else{
       boardSizeElem.textContent = "Enter " + (16 - length) + " more letters"
    }
})

// Rows used to initialize gameboard and in absence of user input
let defaultRows = [
    ['I', 'S', 'O', 'L'],
    ['E', 'D', 'L', 'V'],
    ['R', 'S', 'E', 'E'],
    ['A', 'U', 'Q', 'S']
]

let gameboardElem = document.querySelector('#gameboard')

// Function to generate initial availArray
function generateAvailArray(rowCount, colCount) {
    let availArray = []
    for (let i = 0; i < rowCount; i++) {
        availArray.push([])
        for (let j = 0; j < colCount; j++) {
            availArray[i].push(true)
        }
    }
    return availArray
}

//////////////////////////
// Define global functions
//////////////////////////

// Function to create gameboard from rows array
function createGameboard(rows) {
    // Create rows on gameboard
    for (let i = 0; i < rows.length; i++) {
        rowElem = document.createElement('div')
        rowElem.className = "row"
        rowElem.dataset.row = i // Not sure this is used
        gameboardElem.appendChild(rowElem)
        //Create tiles in rows
        for (let j = 0; j < rows[0].length; j++) {
            tileElem = document.createElement('div')
            tileElem.className = "tile"
            tileElem.id = "index" + i + j // Coordinate of tile for hover styling
            if (tileElem.textContent = rows[i][j] == '') { // Not currently in use
                tileElem.textContent = "X"
                tileElem.style.color = "black"
            } else {
                tileElem.textContent = rows[i][j]
            }
            tileElem.dataset.col = j // Not sure this is used
            tileElem.dataset.avail = "true"
            rowElem.appendChild(tileElem)
        }
    }
}

// Generate dictionary array and filter it to only include words that contain letters in the rows array
async function createDictionary() {
    let uniqueLetters = getUniqueLetters()
    let response = await fetch("dictionary.txt")
    let dictionaryString = await response.text()
    dictionary = dictionaryString.split('\n')
    dictionary = dictionary.filter(word => word.length >= 4)
    //console.log(dictionary.length + " words in original dictionary")
    dictionary = dictionary.filter(word => {
        let wordLetters = [...word.split('')]
        for (let letter of wordLetters) {
            if (!uniqueLetters.includes(letter)) {
                return false
            }
        }
        return true
    })
    //console.log(dictionary.length + " words in filtered dictionary")
}

// Combines rows array into a single array and remove duplicates
function getUniqueLetters() {
    let letters = []
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            letters.push(rows[i][j])
        }
    }
    return [...new Set(letters)]
}

// Create intial gameboard
createGameboard(defaultRows)

///////////////////////////////
// Main solver wrapper function
///////////////////////////////

async function solver() {
    solveButton.textContent = "Solving..."

    function createRows() {
        let inputLetters = enterGameElem.value.toUpperCase()
        if (!inputLetters) return defaultRows
        if (inputLetters.length !== 16) return
        let inputRows = inputLetters.split('')
        let rowLength = Math.sqrt(inputLetters.length)
        let rows = []
        let row = []
        for (let i = 0; i < inputRows.length; i++) {
            row.push(inputLetters[i])
            if (row.length == rowLength) {
                rows.push(row)
                row = []
            }
        }
        //console.log(rows)
        return rows
    }
    rows = createRows()
    if(!rows) {
        solveButton.textContent = "Get Solutions"
        alert("Please enter 16 letters")
        return
    }
    document.querySelector('#gameboard').innerHTML = ''
    createGameboard(rows)

    // Define function scope variables
    let solutionArray = []
    let solutionLettersArray = []
    let currentLettersArray = []
    let currentWord = []
    let rowCount = rows.length
    let colCount = rows[0].length
    let availArray = generateAvailArray(rowCount, colCount)
    await createDictionary()
    startTime = Date.now() // For calculating time to solve

    // Function to deal with each tile on the gameboard
    // The heavy lifting is done here
    // Each time this is called, a new letter cycle starts. It is called recursively until all letters have been used.

    function getNextTile(row, col) {

        // Modifier indicate where to get the next tile from
        let rowMods = [-1, -1, -1, 0, 1, 1, 1, 0] // Add this number to the row index
        let colMods = [-1, 0, 1, 1, 1, 0, -1, -1] // Add this number to the column index

        const SURROUNDING_TILE_COUNT = 8
        // [0][1][2][ ]
        // [7][X][3][ ]
        // [6][5][4][ ]
        // [ ][ ][ ][ ]

        // Define internal functions for getNextTile
        // Function to change tile availabilty when it is added or removed from currentWord
        function toggleAvail(row, col, status) {
            if (status === "true") {
                availArray[row][col] = true
            } else if (status === "false") {
                availArray[row][col] = false
            }
        }

        // Function to remove take care of tile removal
        function removeTile(row, col) {
            currentWord.pop()
            currentLettersArray.pop()
            toggleAvail(row, col, "true")
        }

        /////////////////////////////
        // START OF getNextTile work
        /////////////////////////////

        // If the current tile is not available, move on to the next tile
        if (rows[row][col] === '') return

        // Make the current tile unavailable
        toggleAvail(row, col, "false")

        // If this is the first iteration, initialize current letter.
        if (currentWord.length < 1) {
            currentWord.push(rows[row][col])
            currentLettersArray.push(`${row}${col}`)
        }

        // Find all possible words eminating from tile.
        for (let i = 0; i <= SURROUNDING_TILE_COUNT; i++) {
            // If the last round was the last round in the cycle, remove an extra letter and go to next round.
            if (i == SURROUNDING_TILE_COUNT) {
                removeTile(row, col)
                continue
            }

            // Define row and column modifiers.
            let rowMod = rowMods[i]
            let colMod = colMods[i]

            // Define row and column values for the next tile.
            let newRow = row + rowMod
            let newCol = col + colMod

            // Catch and throw away invalid tiles (off the gameboard, not available, empty value).
            let isValidRowCol = newRow >= 0 && newCol >= 0 && newCol < colCount && newRow < rowCount
            let isValidTile = isValidRowCol && availArray[newRow][newCol] === true && rows[newRow][newCol] !== ""
            if (!isValidTile) {
                continue
            }

            // Define next letter based on row and column values.
            let nextLetter = rows[newRow][newCol]
            toggleAvail(newRow, newCol, "false")

            // Add next letter to running word and perform dictionary filtering based on current letters. 
            currentWord.push(nextLetter)
            currentLettersArray.push(`${newRow}${newCol}`)
            newDict = dictionary.filter(word => currentWord.join('') === word.substring(0, currentWord.length))
            //console.log(newDict)
            //console.log(currentWord)
            joinedCurrentWord = currentWord.join('')

            // Find out if the last check was a new solution and log it out.
            let isValidWord = newDict[0] === joinedCurrentWord
            if (isValidWord) {
                isNewValidWord = solutionArray.indexOf(joinedCurrentWord) === -1
            } else {
                isNewValidWord = false
            }
            if (isValidWord) {
                //console.log("Solution! " + joinedCurrentWord)
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

    // END OF getNextTile FUNCTION

    // Run through every available tile with getNextTile
    for (let l = 0; l < rowCount; l++) {
        for (let m = 0; m < colCount; m++) {
            getNextTile(l, m)
        }
    }

    // Create solution objects from arrays
    function createSolutionsObjectsArray() {
        let array = []
        for (let i = 0; i < solutionArray.length; i++) {
            array.push({
                word: solutionArray[i],
                letters: solutionLettersArray[i]
            })
        }
        return array
    }

    let solutionObjects = createSolutionsObjectsArray()
    //console.log(solutionObjects)

    // Remove duplicates from solution objects and sort alphabetically
    solutionObjects = solutionObjects.filter((filterSolution, index, originalArray) =>
        index === originalArray.findIndex((originalSolution) => (
            originalSolution.word === filterSolution.word
        ))
    )
    solutionObjects.sort((a, b) => b.word.length - a.word.length)
    //console.log(solutionArray)

    // Function to randomly assign colors to solutions for onhover highlighting
    function colorWord(e, color) {
        function generateRandomInteger(max) {
            return Math.floor(Math.random() * max) + 1;
        }
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

    //////////////////////////////////////
    // Create HTML elements for solutions
    //////////////////////////////////////

    let gameboardElem = document.querySelector("#game-elements")

    // Create word list container and append it to the gameboard

    // If a word list elem already exists, remove it
    if (document.getElementById('word-list')) {
        document.getElementById('word-list').remove()
    }

    let wordListContainerElem = document.createElement("div")
    wordListContainerElem.id = "word-list"
    gameboardElem.appendChild(wordListContainerElem)

    // Create the word list and append it to the word list container
    let wordListElem = document.createElement("ol")
    wordListContainerElem.appendChild(wordListElem)
    solutionObjects.forEach((item) => {
        let listItem = document.createElement("li")
        listItem.dataset.tiles = item.letters
        listItem.textContent = item.word
        listItem.addEventListener("mouseover", (e) => colorWord(e))
        listItem.addEventListener("mouseout", (e) => colorWord(e, "black"))
        wordListElem.appendChild(listItem)

    })
    wordListContainerElem.appendChild(wordListElem)

    // Final outputs and formatting
    endTime = Date.now()
    runTime = endTime - startTime
    console.log("Runtime was " + (runTime / 1000) + " seconds.")
    solveButton.textContent = "Get Solutions"
    wordListContainerElem.scrollIntoView({
        behavior: 'smooth'
    })
}

// END OF solver FUNCTION