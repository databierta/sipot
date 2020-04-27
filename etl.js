#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const XLSX = require('xlsx')

function getMetadataForFile (filepath) {
  const quote = s => `"${s}"`
  const formatCellValue = (v = '') => quote(v.trim().replace(':', ''))

  let workbook = XLSX.readFile(filepath)
  // A veces "Informacion" otras "Información" pero siempre la primera
  const infoSheetName = workbook.SheetNames[0]
  const infoSheet = workbook.Sheets[infoSheetName]

  // Los XLSX enviados por correo traen otras 2 columnas en B y C que tenemos que saltar
  const cells = filepath.endsWith('.xlsx')
    ? ['B1', 'B2', 'B3', 'B4', 'D7']
    : ['B1', 'B2', 'B3', 'B4', 'B7']

  const metadata = cells
    .map(cellId => formatCellValue((infoSheet[cellId] || {}).v))

  return metadata
}

;(async () => {
  const DELIMITER = ';'
  const dir = path.join(process.cwd(), argv.directory || '')

  const readdir = promisify(fs.readdir)
  const files = await readdir(dir)
  const xls = files.filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'))

  const headers = [
    'Nombre del Sujeto Obligado',
    'Normativa',
    'Formato',
    'Periodos',
    'Ejercicio',
    'Archivo'
  ]

  const scandata = [headers.join(DELIMITER)]

  for (let filename of xls) {
    const filepath = `${dir}${filename}`
    const metadata = getMetadataForFile(filepath)
    metadata.push(filename)
    scandata.push(metadata.join(DELIMITER))
  }

  console.log(scandata.join('\n'))
})()
