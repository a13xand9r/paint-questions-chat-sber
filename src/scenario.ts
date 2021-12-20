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
import { answerHandler, assistantRightAnswerHandler, helloHandler, noMatchHandler, questionHandler, rightAnswerHandler, runAppHandler, wrongAnswerHandler } from './handlers'
import model from './intents.json'
require('dotenv').config()

const storage = new SaluteMemoryStorage()
const intents = createIntents(model.intents)
const { intent } = createMatchers<ScenarioRequest, typeof intents>()

const userScenario = createUserScenario<ScenarioRequest>({
    Hello: {
        match: () => false,
        handle: helloHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.5}),
                handle: ({}, dispatch) => {
                    dispatch && dispatch(['Question'])
                }
            },
            No: {
                match: intent('/Нет', {confidence: 0.5}),
                handle: ({res}) => {
                    res.setPronounceText('Тогда до встречи!')
                    closeApp(res)
                }
            }
        }
    },
    RightAnswer: {
        match: () => false,
        handle: rightAnswerHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.5}),
                handle: ({}, dispatch) => {
                    dispatch && dispatch(['Question'])
                }
            },
            No: {
                match: intent('/Нет', {confidence: 0.5}),
                handle: ({res}) => {
                    res.setPronounceText('Тогда до встречи!')
                    closeApp(res)
                }
            }
        }
    },
    AssistantRightAnswer: {
        match: () => false,
        handle: assistantRightAnswerHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.5}),
                handle: ({}, dispatch) => {
                    dispatch && dispatch(['Question'])
                }
            },
            No: {
                match: intent('/Нет', {confidence: 0.5}),
                handle: ({res}) => {
                    res.setPronounceText('Тогда до встречи!')
                    closeApp(res)
                }
            }
        }
    },
    WrongAnswer: {
        match: () => false,
        handle: wrongAnswerHandler,
        children: {
            Yes: {
                match: intent('/Да', {confidence: 0.5}),
                handle: ({}, dispatch) => {
                    dispatch && dispatch(['Question'])
                }
            },
            No: {
                match: intent('/Нет', {confidence: 0.5}),
                handle: ({}, dispatch) => {
                    dispatch && dispatch(['AssistantRightAnswer'])
                }
            }
        }
    },
    Question: {
        match: () => false,
        handle: questionHandler,
        children: {
            Answer: {
                match: req => !!req.message.original_text,
                handle: answerHandler
            }
        }
    },
    Answer: {
        match: intent('/Цвет', {confidence: 0.5}),
        handle: answerHandler
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