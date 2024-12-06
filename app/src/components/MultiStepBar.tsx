import "./css/MultiStepBar.css";

function Multi() {
    return (
        <div className="container">
            <div className="progress_container">
                <div className="progress"></div>
                <div className="circle">1</div>
                <div className="circle">2</div>
                <div className="circle">3</div>
            </div>
            <div className="content">Learn React JS</div>
            <div className="btns">
                <button className="btn">Prev</button>
                <button className="btn">Next</button>
            </div>
        </div>
    )
}

export function MultiStepBar() {
    return <Multi />
}
