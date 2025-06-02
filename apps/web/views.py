from django.shortcuts import render

def shipments(request):
    return render(request, 'pages/shipments.html')

def tracking(request):
    return render(request, 'pages/tracking.html')