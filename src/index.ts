import express from 'express'
import cors from 'cors'
import { webHookRout } from './routes/webHookRout'
require('dotenv').config()

const PORT = process.env.PORT ?? 5000

const app = express()
app.use(express.json())
app.use(cors())
app.use(webHookRout)

app.listen(PORT, () => {
    console.log('server started on port ', PORT)
})

app.get('/', (_, res) => {
    res.status(200).send('Салют приложение')
})

