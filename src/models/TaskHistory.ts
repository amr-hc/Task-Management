import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskHistory extends Document {
  taskId: mongoose.Types.ObjectId;
  action: string;
  field: string;
  oldValue?: any;
  newValue?: any;
  changedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const taskHistorySchema = new Schema<ITaskHistory>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    action: { type: String, required: true },
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const TaskHistory = mongoose.model<ITaskHistory>('TaskHistory', taskHistorySchema);
