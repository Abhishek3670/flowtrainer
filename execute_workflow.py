#!/usr/bin/env python3
import argparse, json, os, sys
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix

def load_split(project_id, node_id):
    # Check if we're running in Docker or locally
    if os.path.exists("/app/data"):
        base = f"/app/data/{project_id}"
    else:
        base = f"test_data/{project_id}"
    
    with open(os.path.join(base, f"{node_id}_train.json")) as f:
        train = json.load(f)
    with open(os.path.join(base, f"{node_id}_test.json")) as f:
        test = json.load(f)
    return train['X'], train['y'], test['X'], test['y']

def save_result(project_id, node_id, result):
    # Check if we're running in Docker or locally
    if os.path.exists("/app/data"):
        out_dir = f"/app/data/{project_id}/results"
    else:
        out_dir = f"test_data/{project_id}/results"
    
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, f"{node_id}_result.json"), 'w') as f:
        json.dump(result, f, indent=2)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--project-id', required=True)
    p.add_argument('--node-id', required=True)
    p.add_argument('--type', required=True)
    p.add_argument('--params', required=True)
    args = p.parse_args()

    X_train, y_train, X_test, y_test = load_split(args.project_id, args.node_id)
    params = json.loads(args.params)

    # Model selection
    if args.type == 'linear-regression':
        model = LinearRegression(**params)
    elif args.type == 'random-forest':
        model = RandomForestClassifier(**params)
    elif args.type == 'svm':
        model = SVC(**params)
    else:
        print(f"Unsupported type {args.type}", file=sys.stderr)
        sys.exit(1)

    # Train & Evaluate
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    # Metrics & matrix
    result = {
        'accuracy': accuracy_score(y_test, preds),
        'precision': precision_score(y_test, preds, average='macro', zero_division=0),
        'recall': recall_score(y_test, preds, average='macro', zero_division=0),
        'confusion_matrix': confusion_matrix(y_test, preds).tolist()
    }
    print(json.dumps(result, indent=2))
    save_result(args.project_id, args.node_id, result)

if __name__ == '__main__':
    main()
