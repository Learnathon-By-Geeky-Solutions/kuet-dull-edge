import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ChatService } from './chat.service'
import { CreateChatDto } from './dto/create-chat.dto'
import { UpdateChatDto } from './dto/update-chat.dto'
import { ApiBody } from '@nestjs/swagger'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        inputText: {
          type: 'string'
        }
      }
    }
  })
  @Post('test')
  test(@Body() body) {
    return this.chatService.test(body.inputText)
  }

  @Post()
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatService.create(createChatDto)
  }

  @Get()
  findAll() {
    return this.chatService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    return this.chatService.update(+id, updateChatDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatService.remove(+id)
  }

  @Get(':id/response')
  getResponse(@Param('id') id: string) {
    return this.chatService.getResponse(+id)
  }
}
