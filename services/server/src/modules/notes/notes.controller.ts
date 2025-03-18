import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common'
import { NotesService } from './notes.service'
import { CreateNoteDto } from './dto/create-note.dto'
import { UpdateNoteDto } from './dto/update-note.dto'
import { Note } from './schemas/note.schema'

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(@Body() createNoteDto: CreateNoteDto): Promise<Note> {
    return this.notesService.create(createNoteDto)
  }

  @Get()
  async findAll(): Promise<Note[]> {
    return this.notesService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Note> {
    return this.notesService.findOne(id)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto): Promise<Note> {
    return this.notesService.update(id, updateNoteDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Note> {
    return this.notesService.remove(id)
  }
}
