import { closeApp } from './utils/responses';
import { ScenarioRequest } from './types';
import { SmartAppBrainRecognizer } from '@salutejs/recognizer-smartapp-brain'
import {
    createIntents,
    createMatchers,
    createSaluteRequest,
    createSaluteResponse,
    createScenarioWalker,
    createSystemScenario,
    createUserScenario,
    NLPRequest,
    NLPResponse,
    SaluteRequest
} from '@salutejs/scenario'
import { SaluteMemoryStorage } from '@salutejs/storage-adapter-memory'
import { assistantRightAnswerHandler, noMatchHandler, questionHandler, rightAnswerHandler, runAppHandler, wrongAnswerHandler } from './handlers'
import model from './intents.json'
require('dotenv').config()
import * as dictionary from './system.i18n'

const storage = new SaluteMemoryStorage()
const intents = createIntents(model.intents)
const { intent, match } = createMatchers<ScenarioRequest, typeof intents>()

const userScenario = createUserScenario<ScenarioRequest>({
    RightAnswer: {
        match: req => false,
        handle: rightAnswerHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.5}),
                handle: ({req, res}, dispatch) => {
                    dispatch && dispatch(['Question'])
                }
            },
            No: {
                match: intent('/Нет', {confidence: 0.5}),
                handle: ({req, res}, dispatch) => {
                    res.setPronounceText('Тогда до встречи!')
                    closeApp(res)
                }
            }
        }
    },
    AssistantRightAnswer: {
        match: req => false,
        handle: assistantRightAnswerHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.5}),
                handle: ({req, res}, dispatch) => {
                    dispatch && dispatch(['Question'])
                }
            },
            No: {
                match: intent('/Нет', {confidence: 0.5}),
                handle: ({req, res}, dispatch) => {
                    res.setPronounceText('Тогда до встречи!')
                    closeApp(res)
                }
            }
        }
    },
    WrongAnswer: {
        match: req => false,
        handle: wrongAnswerHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.5}),
                handle: ({req, res}, dispatch) => {
                    res.setAutoListening(true)
                }
            },
            No: {
                match: intent('/Нет', {confidence: 0.5}),
                handle: ({req, res}, dispatch) => {
                    dispatch && dispatch(['AssistantRightAnswer'])
                }
            }
        }
    },
    Question: {
        match: req => true,
        handle: questionHandler
    }
})

const systemScenario = createSystemScenario({
    RUN_APP: runAppHandler,
    NO_MATCH: noMatchHandler
})

const scenarioWalker = createScenarioWalker({
    recognizer: new SmartAppBrainRecognizer(process.env.SMARTAPP_BRAIN_TOKEN),
    intents,
    systemScenario,
    userScenario
})

export const handleNlpRequest = async (request: NLPRequest): Promise<NLPResponse> => {
    const req = createSaluteRequest(request)
    const res = createSaluteResponse(request)

    const sessionId = request.uuid.sub
    const session = await storage.resolve(sessionId)

    await scenarioWalker({ req, res, session })

    await storage.save({ id: sessionId, session })

    return res.message
}