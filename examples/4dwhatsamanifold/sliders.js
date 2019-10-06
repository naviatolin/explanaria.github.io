
class Slider{
    constructor(containerID, valueGetter, valueSetter){

        this.canvas = document.createElement("canvas");
        document.getElementById(containerID).appendChild(this.canvas);

        this.context = this.canvas.getContext("2d");

        this.canvas.height = 150;
        this.canvas.width = 150;

        this.value = 0;

        this.valueGetter = valueGetter; //call every frame to change the display
        this.valueSetter = valueSetter;
        
        this.canvas.addEventListener("mousedown",this.mousedownEvt.bind(this));
        this.canvas.addEventListener("mouseup",this.mouseupEvt.bind(this));
        this.canvas.addEventListener("mousemove",this.mousemoveEvt.bind(this));
        this.canvas.addEventListener("touchmove", this.ontouchmove.bind(this),{'passive':false});
        this.canvas.addEventListener("touchstart", this.ontouchstart.bind(this),{'passive':false});

        //this.update();
    }
    activate(){
        if(this.dragging){
            this.valueSetter(this.value);
        }else{
            this.value = this.valueGetter();
        }
        
        this.draw();
        //window.requestAnimationFrame(this.update.bind(this)); //ugly but works.
    }
    draw(){}
    ontouchstart(event){
        if(event.target == this.canvas)event.preventDefault();

        let rect = this.canvas.getBoundingClientRect();

        for(var i=0;i<event.touches.length;i++){
            let touch = event.touches[i];
            this.onmousedown({x: touch.clientX, y: touch.clientY});
        }
    }

    ontouchmove(event){
        event.preventDefault();
        
        for(var i=0;i<event.touches.length;i++){
            let touch = event.touches[i];
            this.onmousemove({x: touch.clientX, y: touch.clientY});
        }
    }

    mousedownEvt(event){
        let rect = this.canvas.getBoundingClientRect();
        let x = event.x - rect.left;
        let y = event.y - rect.top;   

        this.onmousedown(x,y);
    }
    mouseupEvt(event){
        let rect = this.canvas.getBoundingClientRect();
        let x = event.x - rect.left;
        let y = event.y - rect.top;
        this.onmouseup(x,y);    
    }
    mousemoveEvt(event){
        let rect = this.canvas.getBoundingClientRect();
        let x = event.x - rect.left;
        let y = event.y - rect.top;
        this.onmousemove(x,y);
    }
}



class CircleSlider extends Slider{
    constructor(color, containerID, valueGetter, valueSetter){
        super(containerID, valueGetter, valueSetter);
    
        this.dragging = false;
    
        this.pos = [this.canvas.width/2,this.canvas.height/2];

        this.radius = 50;
        this.pointRadius = 20;
        this.pointColor = color
    }
    draw(){

        //let hueVal = (angle/Math.PI/2 + 0.5)*360;
        //context.fillStyle = "hsl("+hueVal+",50%,50%)";

        this.canvas.width = this.canvas.width;
        this.context.lineWidth = 10;

        this.context.strokeStyle = this.pointColor;
        drawCircleStroke(this.context, this.pos[0],this.pos[1],this.radius);

        this.context.fillStyle = "orange"
        if(this.dragging){
            this.context.fillStyle = "darkorange"
        }
        drawCircle(this.context, this.pos[0] + this.radius*Math.cos(this.value), this.pos[1] + this.radius*Math.sin(this.value), this.pointRadius);
    }
    onmousedown(x,y){
        let ptX = this.pos[0] + this.radius*Math.cos(this.value);
        let ptY = this.pos[1] + this.radius*Math.sin(this.value);
        if(dist(x,y, ptX, ptY) < (this.pointRadius*this.pointRadius) + 10){
            this.dragging = true;
        }
    }
    onmouseup(x,y){
        this.dragging = false;
    }
    angleDiff(a,b){
        const pi2 = Math.PI*2;
        const dist = Math.abs(a-b)%pi2
        return dist > Math.PI ? (pi2-dist) : dist
    }
    onmousemove(x,y){
        if(this.dragging){
            let mouseAngle = Math.atan2(y-this.pos[1],x-this.pos[0]);
            this.value = mouseAngle;
            this.valueSetter(this.value);
        }
    }
}


class RealNumberSlider extends Slider{
    constructor(color, containerID, valueGetter, valueSetter){
        super(containerID, valueGetter, valueSetter);
    
        this.dragging = false;
    
        this.pos = [this.canvas.width/2,this.canvas.height/2];

        this.width = 100;
        this.pointRadius = 20;
        this.lineColor = color
    }
    draw(){

        //let hueVal = (angle/Math.PI/2 + 0.5)*360;
        //context.fillStyle = "hsl("+hueVal+",50%,50%)";

        this.canvas.width = this.canvas.width;
        this.context.lineWidth = 10
        this.context.strokeStyle = this.lineColor;

        //left arrow

        let arrowHeight = 20;
        let arrowWidth = 20;

        this.context.beginPath();

        this.context.moveTo(this.pos[0]-this.width/2 + arrowWidth, this.pos[1]-arrowHeight)
        this.context.lineTo(this.pos[0]-this.width/2, this.pos[1])

        this.context.lineTo(this.pos[0]-this.width/2 + arrowWidth, this.pos[1]+arrowHeight)

        //big line
        this.context.moveTo(this.pos[0]-this.width/2, this.pos[1])
        this.context.lineTo(this.pos[0]+this.width/2, this.pos[1])

        //right arrow
        this.context.moveTo(this.pos[0]+this.width/2 - arrowWidth, this.pos[1]-arrowHeight)
        this.context.lineTo(this.pos[0]+this.width/2, this.pos[1])

        this.context.lineTo(this.pos[0]+this.width/2 - arrowWidth, this.pos[1]+arrowHeight)
        this.context.stroke();

        drawCircleStroke(this.context, this.value*this.width/2 + this.pos[0],this.pos[1],this.radius);

        //point
        this.context.fillStyle = "orange"
        if(this.dragging){
            this.context.fillStyle = "darkorange"
        }
        let xCoord = this.value*this.width/2;
        drawCircle(this.context, this.pos[0] + xCoord, this.pos[1], this.pointRadius);
    }
    onmousedown(x,y){
        let ptX = this.value*this.width/2 + this.pos[0];
        let ptY = this.pos[1]
        if(dist(x,y, ptX, ptY) < (this.pointRadius*this.pointRadius) + 10){
            this.dragging = true;
        }
    }
    onmouseup(x,y){
        this.dragging = false;
    }
    onmousemove(x,y){
        if(this.dragging){
            let mouseAngle = Math.atan2(y-this.pos[1],x-this.pos[0]);
            this.value = 2*(x - this.pos[0])/this.width; //-1 to 1
            this.valueSetter(this.value);
        }
    }
}

//helper func
function drawCircleStroke(context, x,y,radius){
    context.beginPath();
    context.arc(x,y, radius, 0, 2 * Math.PI);
    context.stroke();
}
function drawCircle(context, x,y,radius){
    context.beginPath();
    context.arc(x,y, radius, 0, 2 * Math.PI);
    context.fill();
}
function dist(a,b,c,d){
    return Math.sqrt((b-d)*(b-d)+(c-a)*(c-a))
}
