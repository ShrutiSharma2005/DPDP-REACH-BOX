.PHONY: setup dev test eval demo reset

setup:
	cd backend && python -m venv venv && ./venv/Scripts/pip install -r requirements.txt
	cd frontend && npm install
	@if [ ! -f .env ]; then cp .env.example .env; fi

dev:
	@echo "Starting DPDP Outreach Agent..."
	@echo "Backend: http://localhost:8000 | Frontend: http://localhost:5173"
	cd backend && ./venv/Scripts/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
	cd frontend && npm run dev

test:
	cd backend && ./venv/Scripts/pytest -v

eval:
	cd backend && ./venv/Scripts/python ../scripts/eval.py

demo:
	cd backend && ./venv/Scripts/python ../scripts/seed_demo.py

reset:
	rm -f backend/dpdp_outreach.db
	$(MAKE) demo
