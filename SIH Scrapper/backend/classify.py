"""Zero-shot e-waste classifier (CLIP). No training data needed:
ranks the 8 Kabadiwala material categories against the photo.
Upgrade path: fine-tune once field photos exist (see REPORT.md Phase 1).
"""
import threading

from PIL import Image

LABELS = ["PCB", "CRT", "LCD", "Cables", "Batteries", "Motors/Magnets",
          "Mixed Plastics", "Metals"]
PROMPTS = {
    "PCB": "a photo of a green printed circuit board with electronic chips",
    "CRT": "a photo of an old bulky CRT television or monitor",
    "LCD": "a photo of a flat screen LCD monitor panel",
    "Cables": "a photo of a tangled pile of electrical wires and cables",
    "Batteries": "a photo of used batteries, inverter or lithium cells",
    "Motors/Magnets": "a photo of an electric motor or metal magnet assembly",
    "Mixed Plastics": "a photo of mixed plastic scrap and e-waste casings",
    "Metals": "a photo of scrap metal parts, copper coils or aluminium",
}

_lock = threading.Lock()
_model = _proc = None


def _load():
    global _model, _proc
    with _lock:
        if _model is None:
            from transformers import CLIPModel, CLIPProcessor
            _model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            _proc = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    return _model, _proc


def classify(img: Image.Image, top_k: int = 3):
    """Returns [{label, conf}] sorted desc. conf sums to 1 over 8 categories."""
    import torch
    model, proc = _load()
    img = img.convert("RGB")
    inputs = proc(text=[PROMPTS[l] for l in LABELS], images=img,
                  return_tensors="pt", padding=True)
    with torch.no_grad():
        probs = model(**inputs).logits_per_image.softmax(dim=1)[0]
    ranked = sorted(zip(LABELS, probs.tolist()), key=lambda z: -z[1])
    return [{"label": l, "conf": round(float(c), 3)} for l, c in ranked[:top_k]]
