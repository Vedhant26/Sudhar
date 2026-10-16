.PHONY: install dev train clean docker

install:
	@echo "📦 Installing dependencies..."
	cd web && npm install
	cd api && pip install -r requirements.txt
	cd cli && pip install -e .
	cd ml && pip install -r requirements.txt

dev:
	@echo "🚀 Starting Sudhar development servers..."
	@echo "📱 Web: http://localhost:5173"
	@echo "🔌 API: http://localhost:8000"
	python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000 & cd web && npm run dev

train:
	@echo "🤖 Training all ML models from scratch..."
	cd ml && python train_all.py

ingest:
	@echo "📊 Loading dataset into database..."
	cd api && python seed_data.py

evaluate:
	@echo "📈 Evaluating models..."
	cd ml && python evaluate.py

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf web/dist web/node_modules api/__pycache__ ml/__pycache__ ml/models/*.npz
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete

docker:
	@echo "🐳 Building and starting Docker containers..."
	docker-compose up --build

warroom:
	@echo "🎯 Launching War Room Dashboard..."
	tmux new-session -d -s Sudhar 'Sudhar top'
	tmux split-window -h -t Sudhar 'Sudhar watch'
	tmux split-window -v -t Sudhar 'Sudhar anomalies'
	tmux attach -t Sudhar

demo:
	@echo "🎬 Running demo script..."
	Sudhar demo
