const clues = [
  "Dog",
  "Cat",
  "Wolf",
  "Eerie looking donkey",
  "Mouse"
]

const colors = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "violet",
  "black"
]

const clueParagraph = document.getElementById("clue")
const refreshButton = document.getElementById("refresh")
const undoButton = document.getElementById("undo")
const redoButton = document.getElementById("redo")
const resetButton = document.getElementById("reset")
const strokeWidthSlider = document.getElementById('stroke-width')

const drawArea = document.getElementById("draw")
const context = drawArea.getContext('2d')

const refreshClue = () => {
  const clue = clues[Math.floor(Math.random() * clues.length)]
  context.clearRect(0, 0, drawArea.width, drawArea.height)
  clueParagraph.innerText = clue
  document.title = "Draw The " + clue
}

document.addEventListener('DOMContentLoaded', refreshClue)

const prepareCanvas = () => {
  context.translate(0.5, 0.5);

  const sizeWidth = 70 * window.innerWidth / 100;
  const sizeHeight = 60 * window.innerHeight / 100;

  drawArea.width = sizeWidth;
  drawArea.height = sizeHeight;
  drawArea.style.width = sizeWidth;
  drawArea.style.height = sizeHeight;

  context.lineWidth = 6
  context.lineJoin = 'round'
  context.lineCap = 'round'
}

const saveCanvas = () => {
  localStorage.setItem("image", drawArea.toDataURL())
  localStorage.setItem("clue", clueParagraph.innerText)
}

const restoreCanvas = () => {
  return new Promise((resolve) => {
    const content = localStorage.getItem("image")
    if (content === null) {
      resolve(null)
      return
    }

    const image = new Image();
    image.src = content
    image.onload = () => {
      context.drawImage(image, 0, 0)
      resolve(context.getImageData(0, 0, drawArea.width, drawArea.height))
    }

    const clue = localStorage.getItem("clue")
    if (clue !== null) {
      clueParagraph.innerText = clue
      document.title = "Draw The " + clue
    }
  })
}

document.addEventListener('DOMContentLoaded', async () => {
  prepareCanvas()

  let states = []
  let points = []
  let purged = []
  let tempState = null
  let drawing = false

  // Wait and restore saved state if any
  let initialState = await restoreCanvas()
  if (initialState !== null) {
    states.push(initialState)
  }

  // Initialize color
  let currentColor = colors[colors.length - 1]
  document.getElementById(currentColor).classList.add('accent')
  drawArea.strokeStyle = currentColor

  // Handle the start of drawing a line
  drawArea.onmousedown = (event) => {
    tempState = context.getImageData(0, 0, drawArea.width, drawArea.height)
    drawing = true
    points.push({
      x: event.clientX - event.currentTarget.getBoundingClientRect().left,
      y: event.clientY - event.currentTarget.getBoundingClientRect().top
    })
  }

  drawArea.onmousemove = (event) => {
    if (!drawing) {
      return
    }

    points.push({
      x: event.clientX - event.currentTarget.getBoundingClientRect().left,
      y: event.clientY - event.currentTarget.getBoundingClientRect().top
    })
    context.clearRect(0, 0, drawArea.width, drawArea.height)
    context.putImageData(tempState, 0, 0)

    let firstPoint = points[0]
    let secondPoint = points[1]

    context.beginPath()
    context.moveTo(firstPoint.x, firstPoint.y)

    for (let i = 1; i < points.length; i++) {
      // Connecting each sequential pair of points through a mid-point
      const middlePoint = {
        x: firstPoint.x + (secondPoint.x - firstPoint.x) / 2,
        y: firstPoint.y + (secondPoint.y - firstPoint.y) / 2
      }
      context.quadraticCurveTo(firstPoint.x, firstPoint.y, middlePoint.x, middlePoint.y)
      firstPoint = points[i]
      secondPoint = points[i + 1]
    }

    context.lineTo(firstPoint.x, firstPoint.y)
    context.stroke()
    purged = []
  }

  drawArea.onmouseup = () => {
    states.push(context.getImageData(0, 0, drawArea.width, drawArea.height))
    saveCanvas()
    drawing = false
    points = []
  }

  drawArea.onmouseout = () => {
    if (!drawing) {
      return
    }
    states.push(context.getImageData(0, 0, drawArea.width, drawArea.height))
    saveCanvas()
    drawing = false
    points = []
  }

  undoButton.onclick = () => {
    if (states.length === 0) {
      return
    }

    purged.push(states.pop())

    if (states.length !== 0) {
      context.putImageData(states[states.length - 1], 0, 0)
      saveCanvas()
    } else {
      context.clearRect(0, 0, drawArea.width, drawArea.height)
    }
  }

  redoButton.onclick = () => {
    if (purged.length === 0) {
      return
    }

    const restore = purged.pop()
    context.putImageData(restore, 0, 0)
    states.push(restore)
    saveCanvas()
  }

  refreshButton.onclick = () => {
    if (!confirm("Are you sure you want to get a new clue?\nTHE CURRENT IMAGE AND HISTORY ARE NOT GOING TO BE SAVED")) {
      return
    }
    purged = []
    states = []
    refreshClue()
    saveCanvas()
  }

  resetButton.onclick = () => {
    if (!confirm("Are you sure you want to reset current drawing area?")) {
      return
    }
    purged = []
    states = []
    context.clearRect(0, 0, drawArea.width, drawArea.height)
    saveCanvas()
  }

  /**
   * Colors
   */
  for (let color of colors) {
    document.getElementById(color).onclick = () => {
      document.getElementById(currentColor).classList.remove('accent')
      currentColor = color
      document.getElementById(currentColor).classList.add('accent')
      context.strokeStyle = color
    }
  }

  /**
   * Stroke width
   */
  strokeWidthSlider.oninput = () => {
    context.lineWidth = strokeWidthSlider.value
  }
})
