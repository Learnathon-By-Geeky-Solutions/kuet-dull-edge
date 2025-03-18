import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Note } from './schemas/note.schema'
import { CreateNoteDto } from './dto/create-note.dto'
import { UpdateNoteDto } from './dto/update-note.dto'

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private noteModel: Model<Note>) {}

  // Create a new note
  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    const createdNote = new this.noteModel(createNoteDto)
    return createdNote.save()
  }

  // Get all notes
  async findAll(): Promise<Note[]> {
    return this.noteModel.find().exec()
  }

  // Get a specific note by ID
  async findOne(id: string): Promise<Note> {
    return this.noteModel.findById(id).exec()
  }

  // Update a note
  async update(id: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
    return this.noteModel
      .findByIdAndUpdate(id, updateNoteDto, {
        new: true
      })
      .exec()
  }

  // Delete a note
  async remove(id: string): Promise<Note> {
    return this.noteModel.findByIdAndDelete(id).exec()
  }
}
