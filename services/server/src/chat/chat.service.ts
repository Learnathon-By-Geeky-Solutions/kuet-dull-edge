import { Injectable } from '@nestjs/common'
import { CreateChatDto } from './dto/create-chat.dto'
import { UpdateChatDto } from './dto/update-chat.dto'
import { Ollama } from '@langchain/ollama'

const llm = new Ollama({
  model: 'gemma:2b', // Default value
  temperature: 0,
  maxRetries: 2
  // other params...
})

@Injectable()
export class ChatService {
  async test(inputText: string) {
    return await llm.invoke(inputText)
  }

  create(createChatDto: CreateChatDto) {
    return 'This action adds a new chat'
  }

  findAll() {
    return `This action returns all chat`
  }

  findOne(id: number) {
    return `This action returns a #${id} chat`
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`
  }

  remove(id: number) {
    return `This action removes a #${id} chat`
  }
}
