import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = draw
  stats: {
    [String]: {
      wpm: Number,
      accuracy: Number,
      progress: Number,
      suspicious: Boolean,
    },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Match', matchSchema);
