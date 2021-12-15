import { Router } from 'express'
import { handleNlpRequest } from '../scenario'

export const webHookRout = Router()

webHookRout.post('/api/hook', async (req, res) => {
    console.log('api/hook POST request')
    res.status(200).json(await handleNlpRequest(req.body))
})

webHookRout.get('/api/hook', (req, res) => {
    console.log('api/hook GET request')
    res.status(200).json({ message: 'this route need POST method' })
})